// src/pages/Inspections/InspectionStage4Form.jsx
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const InspectionStage4Form = ({ inspection, isReadOnly, onSave, saving }) => {
  const [formData, setFormData] = useState({
    finance_check_date: '',
  });

  useEffect(() => {
    if (inspection) {
      setFormData({
        finance_check_date: inspection.finance_check_date || '',
      });
    }
  }, [inspection]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Summary Information */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
        <h2 className="text-xs font-semibold text-blue-900 mb-2">Certificate Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-gray-600">Certificate No</p>
            <p className="text-sm font-bold text-gray-900">{inspection.contract_no}</p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-gray-600">Department</p>
            <p className="text-sm font-bold text-gray-900">{inspection.department_name}</p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-gray-600">Contractor</p>
            <p className="text-sm font-bold text-gray-900">{inspection.contractor_name}</p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-gray-600">Total Items</p>
            <p className="text-sm font-bold text-gray-900">{inspection.total_items_count}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-gray-600">Accepted Quantity</p>
            <p className="text-sm font-bold text-green-600">{inspection.total_accepted || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-gray-600">Rejected Quantity</p>
            <p className="text-sm font-bold text-red-600">{inspection.total_rejected || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-gray-600">Total Value</p>
            <p className="text-sm font-bold text-blue-600">
              Rs. {parseFloat(inspection.total_value || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Contract Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">Contract No:</span>
            <span className="ml-2 font-medium text-gray-900">{inspection.contract_no}</span>
          </div>
          <div>
            <span className="text-gray-600">Contract Date:</span>
            <span className="ml-2 font-medium text-gray-900">
              {inspection.contract_date ? new Date(inspection.contract_date).toLocaleDateString() : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Indenter:</span>
            <span className="ml-2 font-medium text-gray-900">{inspection.indenter}</span>
          </div>
          <div>
            <span className="text-gray-600">Indent No:</span>
            <span className="ml-2 font-medium text-gray-900">{inspection.indent_no}</span>
          </div>
          <div>
            <span className="text-gray-600">Delivery Date:</span>
            <span className="ml-2 font-medium text-gray-900">
              {inspection.date_of_delivery ? new Date(inspection.date_of_delivery).toLocaleDateString() : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Delivery Type:</span>
            <span className="ml-2 font-medium text-gray-900">{inspection.delivery_type_display}</span>
          </div>
        </div>
      </div>

      {/* Items List with Stock & Central Register Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Inspection Items with Register Details</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">#</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Item</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Ordered</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Delivered</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Accepted</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Rejected</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Unit Price</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Total Value</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Stock Reg</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Stock Page</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Central Reg</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Central Page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inspection.inspection_items && inspection.inspection_items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 py-1 text-xs text-gray-600">{index + 1}</td>
                  <td className="px-2 py-1 text-xs text-gray-900 font-medium">
                    {item.item_name || item.item}
                  </td>
                  <td className="px-2 py-1 text-xs text-gray-600">{item.ordered_quantity}</td>
                  <td className="px-2 py-1 text-xs text-gray-600">{item.delivered_quantity}</td>
                  <td className="px-2 py-1 text-xs text-green-600 font-medium">{item.accepted_quantity}</td>
                  <td className="px-2 py-1 text-xs text-red-600">{item.rejected_quantity}</td>
                  <td className="px-2 py-1 text-xs text-gray-600">
                    {item.unit_price ? `Rs. ${parseFloat(item.unit_price).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-2 py-1 text-xs text-gray-900 font-medium">
                    {item.unit_price && item.accepted_quantity ? 
                      `Rs. ${(parseFloat(item.unit_price) * item.accepted_quantity).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-2 py-1 text-xs text-gray-600">
                    {item.stock_register_no || '-'}
                  </td>
                  <td className="px-2 py-1 text-xs text-gray-600">
                    {item.stock_register_page_no || '-'}
                  </td>
                  <td className="px-2 py-1 text-xs text-gray-600">
                    {item.central_register_no || '-'}
                  </td>
                  <td className="px-2 py-1 text-xs text-gray-600">
                    {item.central_register_page_no || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Finance Check */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Audit/Finance Check</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Finance Check Date
            </label>
            <input
              type="date"
              name="finance_check_date"
              value={formData.finance_check_date}
              onChange={handleChange}
              disabled={isReadOnly}
              className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        {!isReadOnly && (
          <div className="mt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-medium disabled:opacity-50 flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Workflow Notes */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-2">
        <h2 className="text-xs font-semibold text-gray-900 mb-1">Workflow History</h2>
        <div className="space-y-1 text-xs text-gray-600">
          {inspection.created_at && (
            <p>
              <span className="font-medium">Created:</span>{' '}
              {new Date(inspection.created_at).toLocaleString()} by {inspection.created_by_name}
            </p>
          )}
          {inspection.submitted_at && (
            <p>
              <span className="font-medium">Submitted to Stock:</span>{' '}
              {new Date(inspection.submitted_at).toLocaleString()}
            </p>
          )}
          {inspection.approved_at && (
            <p>
              <span className="font-medium">Approved:</span>{' '}
              {new Date(inspection.approved_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </form>
  );
};

export default InspectionStage4Form;