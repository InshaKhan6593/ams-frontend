// src/pages/Inspections/InspectionStage1Form.jsx
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const InspectionStage1Form = ({ 
  inspection, 
  departments, 
  isReadOnly, 
  isEditMode, 
  onInspectionChange
}) => {
  // Initialize form data from inspection prop
  const [formData, setFormData] = useState(() => ({
    date: inspection?.date || '',
    contract_no: inspection?.contract_no || '',
    contract_date: inspection?.contract_date || '',
    contractor_name: inspection?.contractor_name || '',
    contractor_address: inspection?.contractor_address || '',
    consignee_name: inspection?.consignee_name || '',
    consignee_designation: inspection?.consignee_designation || '',
    indenter: inspection?.indenter || '',
    indent_no: inspection?.indent_no || '',
    department: inspection?.department || '',
    date_of_delivery: inspection?.date_of_delivery || '',
    delivery_type: inspection?.delivery_type || 'FULL',
    remarks: inspection?.remarks || '',
    inspected_by: inspection?.inspected_by || '',
    date_of_inspection: inspection?.date_of_inspection || '',
  }));

  // Keep inspection_items in sync with parent
  const inspectionItems = inspection?.inspection_items || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    
    // Sync to parent - only send the changed field
    if (onInspectionChange) {
      onInspectionChange({
        [name]: value
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...inspectionItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    // Note: Tendered quantity is entered manually by user
    // Accepted + Rejected should not exceed Tendered (validated in UI)

    // Update parent state - only send inspection_items
    if (onInspectionChange) {
      onInspectionChange({
        inspection_items: newItems
      });
    }
  };

  const handleAddItem = () => {
    const newItem = {
      item_description: '',
      tendered_quantity: 0,
      accepted_quantity: 0,
      rejected_quantity: 0,
      unit_price: 0,
      remarks: '',
    };
    
    const newItems = [...inspectionItems, newItem];
    
    // Update parent state - only send inspection_items
    if (onInspectionChange) {
      onInspectionChange({ 
        inspection_items: newItems 
      });
    }
  };

  const handleDeleteItem = (index) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const newItems = inspectionItems.filter((_, i) => i !== index);
      
      // Update parent state - only send inspection_items
      if (onInspectionChange) {
        onInspectionChange({ 
          inspection_items: newItems 
        });
      }
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Certificate Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={isReadOnly || isEditMode}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Contract No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contract_no"
              value={formData.contract_no}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Contract Date
            </label>
            <input
              type="date"
              name="contract_date"
              value={formData.contract_date}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Contractor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contractor_name"
              value={formData.contractor_name}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Contractor Address
            </label>
            <input
              type="text"
              name="contractor_address"
              value={formData.contractor_address}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Consignee Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="consignee_name"
              value={formData.consignee_name}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Consignee Designation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="consignee_designation"
              value={formData.consignee_designation}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Indenter <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="indenter"
              value={formData.indenter}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Indent No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="indent_no"
              value={formData.indent_no}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Date of Delivery
            </label>
            <input
              type="date"
              name="date_of_delivery"
              value={formData.date_of_delivery}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Delivery Type
            </label>
            <select
              name="delivery_type"
              value={formData.delivery_type}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isReadOnly}
            >
              <option value="FULL">Full Delivery</option>
              <option value="PART">Partial Delivery</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Inspected By
            </label>
            <input
              type="text"
              name="inspected_by"
              value={formData.inspected_by}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Date of Inspection
            </label>
            <input
              type="date"
              name="date_of_inspection"
              value={formData.date_of_inspection}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isReadOnly}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              General Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="2"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* Inspection Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xs font-semibold text-gray-900">Inspection Items</h2>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-3 h-3" />
              Add Item
            </button>
          )}
        </div>

        {inspectionItems.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            No items added yet. Click "Add Item" to get started.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs text-blue-800">
                <strong>Stage 1: Basic Item Information</strong><br />
                Enter basic details for each item. Description, tendered, accepted, and rejected quantities are required.
                Detailed specifications and item linking will be handled in later stages.
              </p>
            </div>

            {inspectionItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xs font-medium text-gray-900">Item #{index + 1}</h4>
                  {!isReadOnly && inspectionItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="text-red-600 hover:text-red-700"
                      title="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Item Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={item.item_description || ''}
                      onChange={(e) => handleItemChange(index, 'item_description', e.target.value)}
                      disabled={isReadOnly}
                      rows={2}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      placeholder="Enter item description..."
                      required
                    />
                  </div>

                  {/* Quantities in a single row */}
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Tendered <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.tendered_quantity || 0}
                        onChange={(e) => handleItemChange(index, 'tendered_quantity', parseInt(e.target.value) || 0)}
                        disabled={isReadOnly}
                        min="0"
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Accepted <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.accepted_quantity || 0}
                        onChange={(e) => handleItemChange(index, 'accepted_quantity', parseInt(e.target.value) || 0)}
                        disabled={isReadOnly}
                        min="0"
                        max={item.tendered_quantity || 0}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Rejected
                      </label>
                      <input
                        type="number"
                        value={item.rejected_quantity || 0}
                        onChange={(e) => handleItemChange(index, 'rejected_quantity', parseInt(e.target.value) || 0)}
                        disabled={isReadOnly}
                        min="0"
                        max={item.tendered_quantity || 0}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Unit Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.unit_price || 0}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        disabled={isReadOnly}
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Remarks
                    </label>
                    <textarea
                      value={item.remarks || ''}
                      onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                      disabled={isReadOnly}
                      rows={2}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      placeholder="Any additional remarks..."
                    />
                  </div>

                  {/* Validation message */}
                  {(parseInt(item.accepted_quantity || 0) + parseInt(item.rejected_quantity || 0)) > parseInt(item.tendered_quantity || 0) && (
                    <div className="text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-200">
                      ⚠ Warning: Accepted + Rejected ({parseInt(item.accepted_quantity || 0) + parseInt(item.rejected_quantity || 0)}) 
                      exceeds Tendered ({item.tendered_quantity || 0})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </form>
  );
};

export default InspectionStage1Form;