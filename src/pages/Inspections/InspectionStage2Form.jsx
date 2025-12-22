// src/pages/Inspections/InspectionStage2Form.jsx
import React from 'react';


const InspectionStage2Form = ({ inspection, isReadOnly, onSave }) => {
  const inspectionItems = inspection?.inspection_items || [];

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...inspectionItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Update parent immediately
    if (onSave) {
      onSave({ inspection_items: updatedItems });
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
      {/* Read-only Basic Info */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-2">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Basic Information (Read-only)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-gray-600">Certificate No:</span>
            <span className="ml-2 font-medium text-gray-900">{inspection.certificate_no}</span>
          </div>
          <div>
            <span className="text-gray-600">Contractor:</span>
            <span className="ml-2 font-medium text-gray-900">{inspection.contractor_name}</span>
          </div>
          <div>
            <span className="text-gray-600">Contract No:</span>
            <span className="ml-2 font-medium text-gray-900">{inspection.contract_no}</span>
          </div>
          <div>
            <span className="text-gray-600">Department:</span>
            <span className="ml-2 font-medium text-gray-900">{inspection.department_name}</span>
          </div>
          <div>
            <span className="text-gray-600">Date:</span>
            <span className="ml-2 font-medium text-gray-900">
              {new Date(inspection.date).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Items:</span>
            <span className="ml-2 font-medium text-gray-900">{inspection.total_items_count}</span>
          </div>
        </div>
      </div>

      {/* Stock Register Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">
          Department Stock Register Details
        </h2>
        <p className="text-xs text-gray-600 mb-2">
          Fill stock register number and page number for each item
        </p>

        {inspectionItems.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-500">
            No items found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Item</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Accepted Qty</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                    Stock Register No <span className="text-red-500">*</span>
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                    Page No <span className="text-red-500">*</span>
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                    Entry Date <span className="text-red-500">*</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inspectionItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-xs text-gray-900">
                      {item.item_description || "Item " + (index + 1)}
                    </td>
                    <td className="px-2 py-1 text-xs text-green-600 font-medium">
                      {item.accepted_quantity}
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={item.stock_register_no || ''}
                        onChange={(e) => handleItemChange(index, 'stock_register_no', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="SR-2024-001"
                        required
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={item.stock_register_page_no || ''}
                        onChange={(e) => handleItemChange(index, 'stock_register_page_no', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Page 123"
                        required
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="date"
                        value={item.stock_entry_date || ''}
                        onChange={(e) => handleItemChange(index, 'stock_entry_date', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                        disabled={isReadOnly}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </form>
  );
};

export default InspectionStage2Form;