// src/constants/units.js
// Common accounting units for asset management systems

export const ACCOUNTING_UNITS = [
  // Count-based units
  { value: 'Nos', label: 'Nos (Numbers/Pieces)' },
  { value: 'Pcs', label: 'Pcs (Pieces)' },
  { value: 'Units', label: 'Units' },
  { value: 'Sets', label: 'Sets' },
  { value: 'Pairs', label: 'Pairs' },
  { value: 'Dozen', label: 'Dozen' },
  { value: 'Each', label: 'Each' },

  // Weight-based units
  { value: 'Kg', label: 'Kg (Kilograms)' },
  { value: 'Gm', label: 'Gm (Grams)' },
  { value: 'Mg', label: 'Mg (Milligrams)' },
  { value: 'Quintal', label: 'Quintal' },
  { value: 'Ton', label: 'Ton (Metric Ton)' },
  { value: 'Lb', label: 'Lb (Pounds)' },

  // Volume/Liquid units
  { value: 'Ltr', label: 'Ltr (Liters)' },
  { value: 'ML', label: 'ML (Milliliters)' },
  { value: 'Gallon', label: 'Gallon' },
  { value: 'Barrel', label: 'Barrel' },

  // Length/Distance units
  { value: 'Mtr', label: 'Mtr (Meters)' },
  { value: 'Cm', label: 'Cm (Centimeters)' },
  { value: 'Mm', label: 'Mm (Millimeters)' },
  { value: 'Ft', label: 'Ft (Feet)' },
  { value: 'Inch', label: 'Inch' },
  { value: 'Km', label: 'Km (Kilometers)' },
  { value: 'Yard', label: 'Yard' },

  // Area units
  { value: 'Sqm', label: 'Sqm (Square Meters)' },
  { value: 'Sqft', label: 'Sqft (Square Feet)' },
  { value: 'Acre', label: 'Acre' },

  // Package/Container units
  { value: 'Box', label: 'Box' },
  { value: 'Carton', label: 'Carton' },
  { value: 'Pack', label: 'Pack' },
  { value: 'Bundle', label: 'Bundle' },
  { value: 'Roll', label: 'Roll' },
  { value: 'Ream', label: 'Ream (Paper)' },
  { value: 'Bottle', label: 'Bottle' },
  { value: 'Can', label: 'Can' },
  { value: 'Jar', label: 'Jar' },
  { value: 'Bag', label: 'Bag' },
  { value: 'Sack', label: 'Sack' },
  { value: 'Drum', label: 'Drum' },
  { value: 'Cylinder', label: 'Cylinder' },

  // Office/Stationery specific
  { value: 'Pad', label: 'Pad' },
  { value: 'Sheet', label: 'Sheet' },
  { value: 'Book', label: 'Book' },
  { value: 'Copy', label: 'Copy' },

  // Furniture/Equipment specific
  { value: 'Unit', label: 'Unit' },
  { value: 'Assembly', label: 'Assembly' },
  { value: 'Module', label: 'Module' },

  // Time-based (for services/subscriptions)
  { value: 'Hour', label: 'Hour' },
  { value: 'Day', label: 'Day' },
  { value: 'Month', label: 'Month' },
  { value: 'Year', label: 'Year' },

  // Other common
  { value: 'Lot', label: 'Lot' },
  { value: 'Job', label: 'Job' },
  { value: 'Trip', label: 'Trip' },
];

// Group units by category for better UX
export const UNIT_GROUPS = {
  'Count': ['Nos', 'Pcs', 'Units', 'Sets', 'Pairs', 'Dozen', 'Each'],
  'Weight': ['Kg', 'Gm', 'Mg', 'Quintal', 'Ton', 'Lb'],
  'Volume': ['Ltr', 'ML', 'Gallon', 'Barrel'],
  'Length': ['Mtr', 'Cm', 'Mm', 'Ft', 'Inch', 'Km', 'Yard'],
  'Area': ['Sqm', 'Sqft', 'Acre'],
  'Package': ['Box', 'Carton', 'Pack', 'Bundle', 'Roll', 'Ream', 'Bottle', 'Can', 'Jar', 'Bag', 'Sack', 'Drum', 'Cylinder'],
  'Office': ['Pad', 'Sheet', 'Book', 'Copy'],
  'Equipment': ['Unit', 'Assembly', 'Module'],
  'Time': ['Hour', 'Day', 'Month', 'Year'],
  'Other': ['Lot', 'Job', 'Trip'],
};

export default ACCOUNTING_UNITS;
