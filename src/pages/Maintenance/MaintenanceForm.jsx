// src/pages/Maintenance/MaintenanceForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Wrench } from 'lucide-react';
import { maintenanceAPI } from '../../api/maintenance';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../api/client';

const MaintenanceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    instance: '',
    maintenance_type: 'PREVENTIVE',
    status: 'SCHEDULED',
    scheduled_date: '',
    started_date: '',
    completed_date: '',
    performed_by: '',
    work_description: '',
    work_performed: '',
    parts_replaced: '',
    issues_found: '',
    recommendations: '',
    labor_cost: '',
    parts_cost: '',
    other_cost: '',
  });

  const [instances, setInstances] = useState([]);
  const [loadingInstances, setLoadingInstances] = useState(false);

  const maintenanceTypes = [
    { value: 'PREVENTIVE', label: 'Preventive Maintenance' },
    { value: 'CORRECTIVE', label: 'Corrective Maintenance' },
    { value: 'EMERGENCY', label: 'Emergency Repair' },
    { value: 'CALIBRATION', label: 'Calibration' },
    { value: 'INSPECTION', label: 'Inspection' },
    { value: 'OVERHAUL', label: 'Overhaul' },
    { value: 'CLEANING', label: 'Cleaning/Servicing' },
    { value: 'UPGRADE', label: 'Upgrade/Modification' },
  ];

  const statuses = [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'DEFERRED', label: 'Deferred' },
  ];

  useEffect(() => {
    fetchInstances();
    if (isEditMode) {
      fetchMaintenanceRecord();
    }
  }, [id]);

  const fetchInstances = async () => {
    try {
      setLoadingInstances(true);
      // Fetch all item instances (fixed assets only)
      const response = await apiClient.get('/item-instances/');
      setInstances(response.data);
    } catch (err) {
      console.error('Error fetching instances:', err);
    } finally {
      setLoadingInstances(false);
    }
  };

  const fetchMaintenanceRecord = async () => {
    try {
      setLoading(true);
      const data = await maintenanceAPI.get(id);
      setFormData({
        instance: data.instance || '',
        maintenance_type: data.maintenance_type || 'PREVENTIVE',
        status: data.status || 'SCHEDULED',
        scheduled_date: data.scheduled_date || '',
        started_date: data.started_date || '',
        completed_date: data.completed_date || '',
        performed_by: data.performed_by || '',
        work_description: data.work_description || '',
        work_performed: data.work_performed || '',
        parts_replaced: data.parts_replaced || '',
        issues_found: data.issues_found || '',
        recommendations: data.recommendations || '',
        labor_cost: data.labor_cost || '',
        parts_cost: data.parts_cost || '',
        other_cost: data.other_cost || '',
      });
      setError('');
    } catch (err) {
      setError('Failed to load maintenance record');
      console.error('Error fetching maintenance record:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        // Convert costs to proper types
        labor_cost: formData.labor_cost ? parseFloat(formData.labor_cost) : null,
        parts_cost: formData.parts_cost ? parseFloat(formData.parts_cost) : null,
        other_cost: formData.other_cost ? parseFloat(formData.other_cost) : null,
        // Convert empty strings to null for date fields
        started_date: formData.started_date || null,
        completed_date: formData.completed_date || null,
      };

      if (isEditMode) {
        await maintenanceAPI.update(id, payload);
        setSuccess('Maintenance record updated successfully!');
      } else {
        await maintenanceAPI.create(payload);
        setSuccess('Maintenance record created successfully!');
      }

      setTimeout(() => navigate('/dashboard/maintenance'), 1500);
    } catch (err) {
      console.error('Error saving maintenance record:', err);
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.detail ||
                          'Failed to save maintenance record';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const selectedInstance = instances.find(i => i.id === parseInt(formData.instance));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/maintenance')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {isEditMode ? 'Edit Maintenance Record' : 'Schedule Maintenance'}
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              {isEditMode ? 'Update maintenance record details' : 'Create a new maintenance schedule'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2.5 py-2 rounded-lg text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-2 rounded-lg text-xs">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Asset Instance */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Asset Instance <span className="text-red-500">*</span>
              </label>
              <select
                name="instance"
                value={formData.instance}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isEditMode}
              >
                <option value="">Select asset instance</option>
                {instances.map(instance => (
                  <option key={instance.id} value={instance.id}>
                    {instance.item_name} - {instance.instance_code} ({instance.current_location_name})
                  </option>
                ))}
              </select>
              {isEditMode && (
                <p className="text-xs text-gray-500 mt-1">Asset cannot be changed after creation</p>
              )}
            </div>

            {/* Maintenance Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Maintenance Type <span className="text-red-500">*</span>
              </label>
              <select
                name="maintenance_type"
                value={formData.maintenance_type}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                {maintenanceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Schedule & Timeline</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Scheduled Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Scheduled Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Started Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Started Date
              </label>
              <input
                type="date"
                name="started_date"
                value={formData.started_date}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Completed Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Completed Date
              </label>
              <input
                type="date"
                name="completed_date"
                value={formData.completed_date}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Performed By */}
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Performed By (Technician/Person)
              </label>
              <input
                type="text"
                name="performed_by"
                value={formData.performed_by}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Technician name or company"
              />
            </div>
          </div>
        </div>

        {/* Work Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Work Details</h2>

          <div className="space-y-2.5">
            {/* Work Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Work Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="work_description"
                value={formData.work_description}
                onChange={handleChange}
                rows="2"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Description of maintenance work to be done..."
                required
              />
            </div>

            {/* Work Performed */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Work Performed
              </label>
              <textarea
                name="work_performed"
                value={formData.work_performed}
                onChange={handleChange}
                rows="2"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Detailed description of actual work performed..."
              />
            </div>

            {/* Parts Replaced */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Parts Replaced
              </label>
              <textarea
                name="parts_replaced"
                value={formData.parts_replaced}
                onChange={handleChange}
                rows="2"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="List of parts replaced during maintenance..."
              />
            </div>

            {/* Issues Found */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Issues Found
              </label>
              <textarea
                name="issues_found"
                value={formData.issues_found}
                onChange={handleChange}
                rows="2"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Any issues or problems discovered..."
              />
            </div>

            {/* Recommendations */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Recommendations
              </label>
              <textarea
                name="recommendations"
                value={formData.recommendations}
                onChange={handleChange}
                rows="2"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Recommendations for future maintenance..."
              />
            </div>
          </div>
        </div>

        {/* Cost Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Cost Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Labor Cost */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Labor Cost
              </label>
              <input
                type="number"
                name="labor_cost"
                value={formData.labor_cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>

            {/* Parts Cost */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Parts Cost
              </label>
              <input
                type="number"
                name="parts_cost"
                value={formData.parts_cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>

            {/* Other Cost */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Other Cost
              </label>
              <input
                type="number"
                name="other_cost"
                value={formData.other_cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Total Cost Display */}
          {(formData.labor_cost || formData.parts_cost || formData.other_cost) && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700">Total Cost:</span>
                <span className="font-bold text-gray-900">
                  {(
                    (parseFloat(formData.labor_cost) || 0) +
                    (parseFloat(formData.parts_cost) || 0) +
                    (parseFloat(formData.other_cost) || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <LoadingSpinner size="small" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update' : 'Schedule'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard/maintenance')}
            className="px-2.5 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm;
