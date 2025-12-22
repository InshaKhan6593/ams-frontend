// src/components/inventory/InstanceEditModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Package, Calendar, DollarSign, Tag, AlertCircle } from 'lucide-react';
import apiClient from '../../api/client';

const InstanceEditModal = ({ instance, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    serial_number: '',
    asset_tag: '',
    condition: 'NEW',
    condition_notes: '',
    purchase_date: '',
    purchase_value: '',
    warranty_expiry: '',
    assigned_to: '',
    assigned_date: '',
    expected_return_date: '',
    last_maintenance_date: '',
    next_maintenance_date: '',
    maintenance_notes: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (instance) {
      setFormData({
        serial_number: instance.serial_number || '',
        asset_tag: instance.asset_tag || '',
        condition: instance.condition || 'NEW',
        condition_notes: instance.condition_notes || '',
        purchase_date: instance.purchase_date || '',
        purchase_value: instance.purchase_value || '',
        warranty_expiry: instance.warranty_expiry || '',
        assigned_to: instance.assigned_to || '',
        assigned_date: instance.assigned_date ? instance.assigned_date.split('T')[0] : '',
        expected_return_date: instance.expected_return_date || '',
        last_maintenance_date: instance.last_maintenance_date || '',
        next_maintenance_date: instance.next_maintenance_date || '',
        maintenance_notes: instance.maintenance_notes || '',
        notes: instance.notes || '',
      });
    }
  }, [instance]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await apiClient.patch(`/item-instances/${instance.id}/`, formData);
      onSave(response.data);
      onClose();
    } catch (err) {
      console.error('Error updating instance:', err);
      setError(err.response?.data?.detail || 'Failed to update instance');
    } finally {
      setSaving(false);
    }
  };

  if (!instance) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-2 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-primary-600" />
                Edit Instance Details
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {instance.instance_code} - {instance.item_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {error && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Asset Identification Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                Asset Identification
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleChange}
                    placeholder="e.g., SN12345678"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Manufacturer's serial number</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Asset Tag
                  </label>
                  <input
                    type="text"
                    name="asset_tag"
                    value={formData.asset_tag}
                    onChange={handleChange}
                    placeholder="e.g., AST-2024-001"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Organization's asset tag</p>
                </div>
              </div>
            </div>

            {/* Condition Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-yellow-600" />
                Condition
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Condition Status
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="NEW">New</option>
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="BEYOND_REPAIR">Beyond Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Condition Notes
                  </label>
                  <textarea
                    name="condition_notes"
                    value={formData.condition_notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Describe the current condition..."
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Financial Information Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-green-600" />
                Financial Information
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Purchase Value
                  </label>
                  <input
                    type="number"
                    name="purchase_value"
                    value={formData.purchase_value}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Warranty Expiry
                  </label>
                  <input
                    type="date"
                    name="warranty_expiry"
                    value={formData.warranty_expiry}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Assignment Section */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                Assignment Details
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    placeholder="Person or department"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Assigned Date
                  </label>
                  <input
                    type="date"
                    name="assigned_date"
                    value={formData.assigned_date}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    name="expected_return_date"
                    value={formData.expected_return_date}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Maintenance Section */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                Maintenance Schedule
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Last Maintenance Date
                  </label>
                  <input
                    type="date"
                    name="last_maintenance_date"
                    value={formData.last_maintenance_date}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Next Maintenance Date
                  </label>
                  <input
                    type="date"
                    name="next_maintenance_date"
                    value={formData.next_maintenance_date}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Maintenance Notes
                </label>
                <textarea
                  name="maintenance_notes"
                  value={formData.maintenance_notes}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Maintenance history, requirements, etc."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* General Notes Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
              <h3 className="text-xs font-semibold text-gray-900 mb-2">
                General Notes
              </h3>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                placeholder="Additional notes and information..."
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstanceEditModal;
