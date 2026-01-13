# Fix: Integer Validation Error - 2026-01-13

## Issue
When creating items in Stage 3 inspection, the form was sending empty strings (`''`) for integer fields, causing Django validation errors:
```
'shelf_life_days': [ErrorDetail(string='A valid integer is required.', code='invalid')]
'maintenance_interval_days': [ErrorDetail(string='A valid integer is required.', code='invalid')]
```

## Root Cause
React form inputs store values as strings. Empty numeric inputs were being sent as `''` instead of being omitted or converted to integers.

Example of problematic data:
```javascript
{
  minimum_stock_alert: '50',  // String instead of integer
  reorder_level: '70',        // String instead of integer
  shelf_life_days: '',        // Empty string instead of omitted
  maintenance_interval_days: '90'  // String instead of integer
}
```

## Fix Applied

**File:** `src/pages/Inspections/InspectionStage3Form.jsx`
**Function:** `handleSubmit` (lines 1239-1300)

### Changes Made

1. **Extended numeric fields list:**
   ```javascript
   const numericFields = [
     'warranty_months',
     'minimum_stock_level',
     'minimum_stock_alert',      // ← Added
     'reorder_level',
     'reorder_quantity',         // ← Added
     'shelf_life_days',          // ← Added
     'maintenance_interval_days' // ← Added
   ];
   ```

2. **Convert string numbers to integers:**
   ```javascript
   numericFields.forEach(field => {
     if (cleanedData[field] === '' || cleanedData[field] === null || cleanedData[field] === undefined) {
       delete cleanedData[field];  // Remove empty values
     } else if (typeof cleanedData[field] === 'string') {
       const num = parseInt(cleanedData[field], 10);
       if (!isNaN(num)) {
         cleanedData[field] = num;  // Convert '90' → 90
       } else {
         delete cleanedData[field];  // Remove invalid values
       }
     }
   });
   ```

3. **Ensure booleans are actual booleans:**
   ```javascript
   if (typeof cleanedData.requires_expiry_tracking === 'string') {
     cleanedData.requires_expiry_tracking = cleanedData.requires_expiry_tracking === 'true';
   }
   if (typeof cleanedData.requires_maintenance === 'string') {
     cleanedData.requires_maintenance = cleanedData.requires_maintenance === 'true';
   }
   ```

4. **Added validation for conditional requirements:**
   ```javascript
   if (cleanedData.requires_expiry_tracking && !cleanedData.shelf_life_days) {
     setError('Shelf life days is required when expiry tracking is enabled');
     return;
   }
   if (cleanedData.requires_maintenance && !cleanedData.maintenance_interval_days) {
     setError('Maintenance interval days is required when maintenance is enabled');
     return;
   }
   ```

## Result

**Before:**
```javascript
{
  minimum_stock_alert: '50',
  reorder_level: '70',
  shelf_life_days: '',
  requires_maintenance: true,
  maintenance_interval_days: '90'
}
```
❌ Backend rejects: "A valid integer is required"

**After:**
```javascript
{
  minimum_stock_alert: 50,          // ✅ Converted to integer
  reorder_level: 70,                // ✅ Converted to integer
  // shelf_life_days omitted         ✅ Empty value removed
  requires_maintenance: true,        // ✅ Boolean
  maintenance_interval_days: 90     // ✅ Converted to integer
}
```
✅ Backend accepts: Item created successfully

## Testing

1. Create new item with stock settings:
   - ✅ Min Stock Alert: 50 → Sent as integer `50`
   - ✅ Reorder Level: 70 → Sent as integer `70`
   - ✅ Reorder Quantity: 10 → Sent as integer `10`

2. Create item with maintenance enabled:
   - ✅ Check "Requires Maintenance"
   - ✅ Enter interval: 90 → Sent as integer `90`

3. Create item with expiry tracking enabled:
   - ✅ Check "Requires Expiry Tracking"
   - ✅ Enter shelf life: 365 → Sent as integer `365`

4. Create item without optional settings:
   - ✅ Leave fields empty → Not sent to backend at all

## Files Modified

- `src/pages/Inspections/InspectionStage3Form.jsx` - Updated `handleSubmit` function

## Status

✅ Fixed and tested
