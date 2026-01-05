// src/pages/Locations/LocationForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Building2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { locationsAPI } from '../../api/locations';
import { useAuth } from '../../hooks/useAuth';
import { locationsKeys } from '../../hooks/queries/useLocations';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LocationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location_type: '',
    parent_location: '',
    is_standalone: false,
    is_store: false,
    description: '',
    address: '',
    in_charge: '',
    contact_number: '',
    is_active: true,
  });

  // Available parent locations
  const [availableParents, setAvailableParents] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Location type options
  const locationTypes = [
    { value: 'DEPARTMENT', label: 'Department' },
    { value: 'BUILDING', label: 'Building' },
    { value: 'STORE', label: 'Store' },
    { value: 'ROOM', label: 'Room' },
    { value: 'LAB', label: 'Lab' },
    { value: 'OFFICE', label: 'Office' },
    { value: 'JUNKYARD', label: 'Junkyard' },
    { value: 'AV_HALL', label: 'AV Hall' },
    { value: 'AUDITORIUM', label: 'Auditorium' },
    { value: 'OTHER', label: 'Other' },
  ];

  useEffect(() => {
    fetchAvailableParents();
    if (isEditMode) {
      fetchLocation();
    }
  }, [id]);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      const data = await locationsAPI.getLocation(id);
      setFormData({
        name: data.name,
        code: data.code,
        location_type: data.location_type,
        parent_location: data.parent_location || '',
        is_standalone: data.is_standalone || false,
        is_store: data.is_store || false,
        description: data.description || '',
        address: data.address || '',
        in_charge: data.in_charge || '',
        contact_number: data.contact_number || '',
        is_active: data.is_active,
      });
      setError('');
    } catch (err) {
      setError('Failed to load location details');
      console.error('Error fetching location:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableParents = async () => {
    try {
      setLoadingParents(true);
      const response = await locationsAPI.getLocations();
      const locations = Array.isArray(response) ? response : response.results || [];
      // Filter to show only locations that can be parents
      setAvailableParents(locations.filter(loc => !loc.is_store));
    } catch (err) {
      console.error('Error fetching parent locations:', err);
      setAvailableParents([]);
    } finally {
      setLoadingParents(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-handle store flag
    if (name === 'location_type') {
      if (value === 'STORE') {
        setFormData(prev => ({ ...prev, is_store: true, is_standalone: false }));
      }
    }

    // Stores cannot be standalone
    if (name === 'is_store' && checked) {
      setFormData(prev => ({ ...prev, is_standalone: false }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }

    // Code is optional - will be auto-generated if not provided
    // Just validate if it's not empty

    if (!formData.location_type) {
      setError('Location type is required');
      return false;
    }

    // Stores cannot be standalone
    if (formData.is_store && formData.is_standalone) {
      setError('Store locations cannot be standalone');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const submitData = {
        name: formData.name,
        code: formData.code.trim() || '',  // Empty string if not provided - backend will auto-generate
        location_type: formData.location_type,
        parent_location: formData.parent_location || null,
        is_standalone: formData.is_standalone,
        is_store: formData.is_store,
        description: formData.description,
        address: formData.address,
        in_charge: formData.in_charge,
        contact_number: formData.contact_number,
        is_active: formData.is_active,
      };

      if (isEditMode) {
        await locationsAPI.updateLocation(id, submitData);
        setSuccess('Location updated successfully!');
      } else {
        await locationsAPI.createLocation(submitData);
        setSuccess('Location created successfully!');
      }

      // Invalidate and refetch locations data
      await queryClient.invalidateQueries({ queryKey: locationsKeys.all });

      setTimeout(() => navigate('/dashboard/locations'), 1500);
    } catch (err) {
      console.error('Error saving location:', err);

      // Extract error message from various possible response formats
      let errorMessage = 'Failed to save location';

      if (err.response?.data) {
        const data = err.response.data;

        // Handle field-specific validation errors
        if (data.parent_location) {
          errorMessage = Array.isArray(data.parent_location)
            ? data.parent_location[0]
            : data.parent_location;
        } else if (data.code) {
          errorMessage = Array.isArray(data.code) ? data.code[0] : data.code;
        } else if (data.name) {
          errorMessage = Array.isArray(data.name) ? data.name[0] : data.name;
        } else if (data.location_type) {
          errorMessage = Array.isArray(data.location_type) ? data.location_type[0] : data.location_type;
        } else if (data.is_standalone) {
          errorMessage = Array.isArray(data.is_standalone) ? data.is_standalone[0] : data.is_standalone;
        } else if (data.is_store) {
          errorMessage = Array.isArray(data.is_store) ? data.is_store[0] : data.is_store;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors)
            ? data.non_field_errors[0]
            : data.non_field_errors;
        } else {
          // If there are any field errors, show the first one
          const firstErrorField = Object.keys(data)[0];
          if (firstErrorField && data[firstErrorField]) {
            const fieldError = data[firstErrorField];
            errorMessage = Array.isArray(fieldError) ? fieldError[0] : fieldError;
          }
        }
      }

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/locations')}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {isEditMode ? 'Edit Location' : 'Create New Location'}
            </h1>
            <p className="text-xs text-gray-600 mt-0">
              {isEditMode ? 'Update location information' : 'Add a new location to the hierarchy'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-2 py-1.5 rounded-lg text-xs">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Location Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Main Building"
                required
              />
            </div>

            {/* Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Location Code <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                placeholder="AUTO-GENERATED"
              />
              <p className="text-xs text-gray-500 mt-0.5">
                Auto-generated if not provided (e.g., DEPT-0001, STR-0002)
              </p>
            </div>

            {/* Location Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="location_type"
                value={formData.location_type}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select type...</option>
                {locationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Parent Location */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Parent Location
              </label>
              {loadingParents ? (
                <div className="flex items-center justify-center py-1">
                  <LoadingSpinner size="small" />
                </div>
              ) : (
                <>
                  <select
                    name="parent_location"
                    value={formData.parent_location}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">No parent (Root location)</option>
                    {availableParents.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.code})
                      </option>
                    ))}
                  </select>
                  {!formData.parent_location && !isEditMode && (
                    <div className="mt-1 bg-amber-50 border border-amber-200 rounded px-1.5 py-1">
                      <p className="text-xs text-amber-700">
                        ⚠️ Only one root location is allowed in the system
                      </p>
                    </div>
                  )}
                </>
              )}
              <p className="text-xs text-gray-500 mt-0.5">Leave empty for root location</p>
            </div>

            {/* In Charge */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                In Charge
              </label>
              <input
                type="text"
                name="in_charge"
                value={formData.in_charge}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="John Doe"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Contact Number
              </label>
              <input
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="+1234567890"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Location description..."
            />
          </div>

          {/* Address */}
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Full address..."
            />
          </div>
        </div>

        {/* Flags & Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">Settings</h2>
          
          <div className="space-y-2">
            {/* Standalone */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_standalone"
                checked={formData.is_standalone}
                onChange={handleChange}
                disabled={formData.is_store}
                className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-900">Standalone Location</span>
                <p className="text-xs text-gray-500">Can have sub-locations and gets a main store</p>
              </div>
            </label>

            {/* Store */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_store"
                checked={formData.is_store}
                onChange={handleChange}
                className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-900">Store Location</span>
                <p className="text-xs text-gray-500">This is an inventory storage location</p>
              </div>
            </label>

            {/* Active */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-900">Active</span>
                <p className="text-xs text-gray-500">Location is currently operational</p>
              </div>
            </label>
          </div>

          {/* Validation Note */}
          {formData.is_store && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs text-blue-700">
                ℹ️ Store locations cannot be marked as standalone
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <LoadingSpinner size="small" />
                Saving...
              </>
            ) : (
              <>
                {isEditMode ? <Save className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                {isEditMode ? 'Update Location' : 'Create Location'}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/dashboard/locations')}
            className="px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationForm;