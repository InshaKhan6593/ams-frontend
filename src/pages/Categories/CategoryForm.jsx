// src/pages/Categories/CategoryForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Tag } from 'lucide-react';
import { categoriesAPI } from '../../api/items';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parent_category: '',
    tracking_type: 'INDIVIDUAL',
    depreciation_rate: 0,
    depreciation_method: 'WDV',
    is_active: true,
  });

  const [broaderCategories, setBroaderCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);

  // Tracking type options
  const trackingTypes = [
    { value: 'INDIVIDUAL', label: 'Individual Tracking (QR Code)', description: 'For fixed assets' },
    { value: 'BULK', label: 'Bulk Tracking (Quantity)', description: 'For consumables' },
    { value: 'BATCH', label: 'Batch Tracking (FIFO with Expiry)', description: 'For perishables' },
  ];

  // Depreciation method options
  const depreciationMethods = [
    { value: 'WDV', label: 'Written Down Value (WDV)', description: 'Reducing balance method' },
    { value: 'SLM', label: 'Straight Line Method (SLM)', description: 'Equal annual depreciation' },
  ];

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const data = await categoriesAPI.get(id);
      setFormData({
        name: data.name || '',
        code: data.code || '',
        description: data.description || '',
        parent_category: data.parent_category || '',
        tracking_type: data.tracking_type || data.inherited_tracking_type || 'INDIVIDUAL',
        depreciation_rate: data.depreciation_rate || 0,
        depreciation_method: data.depreciation_method || 'WDV',
        is_active: data.is_active !== undefined ? data.is_active : true,
      });

      // If editing sub-category, fetch parent info
      if (data.parent_category) {
        const parent = await categoriesAPI.get(data.parent_category);
        setSelectedParent(parent);
      }

      setError('');
    } catch (err) {
      setError('Failed to load category details');
      console.error('Error fetching category:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      // Only fetch broader categories (no parent) for parent selection
      const data = await categoriesAPI.getBroaderCategories();
      setBroaderCategories(data.filter(cat => cat.is_active));
    } catch (err) {
      console.error('Error fetching categories:', err);
      setBroaderCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // When parent category changes, fetch parent details and update inherited fields
  useEffect(() => {
    const fetchParentDetails = async () => {
      if (formData.parent_category) {
        try {
          const parent = await categoriesAPI.get(formData.parent_category);
          console.log('[CategoryForm] Fetched parent category:', parent);
          setSelectedParent(parent);

          // Inherit tracking_type from parent
          const inheritedTrackingType = parent.tracking_type || parent.inherited_tracking_type;

          console.log('[CategoryForm] Inherited tracking_type:', inheritedTrackingType);

          setFormData(prev => ({
            ...prev,
            tracking_type: inheritedTrackingType,
          }));
        } catch (err) {
          console.error('Error fetching parent category:', err);
          setError('Failed to load parent category details');
        }
      } else {
        setSelectedParent(null);
        // Reset to default values for broader category
        if (!isEditMode) {
          setFormData(prev => ({
            ...prev,
            tracking_type: 'INDIVIDUAL',
          }));
        }
      }
    };

    if (formData.parent_category && !isEditMode) {
      fetchParentDetails();
    }
  }, [formData.parent_category, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(''); // Clear errors on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const isBroaderCategory = !formData.parent_category;
      // Fixed assets use INDIVIDUAL tracking type
      const isFixedAssetSubCategory = formData.parent_category && formData.tracking_type === 'INDIVIDUAL';

      const payload = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        parent_category: formData.parent_category || null,
        is_active: formData.is_active,
      };

      // Add fields based on category hierarchy level
      if (isBroaderCategory) {
        // Broader categories must have tracking_type
        payload.tracking_type = formData.tracking_type;
      } else {
        // Sub-categories inherit from parent (backend handles this)
        // Only add depreciation for fixed asset sub-categories (INDIVIDUAL tracking)
        if (isFixedAssetSubCategory) {
          payload.depreciation_rate = parseFloat(formData.depreciation_rate) || null;
          payload.depreciation_method = formData.depreciation_method;
        }
      }

      if (isEditMode) {
        await categoriesAPI.update(id, payload);
        setSuccess('Category updated successfully!');
      } else {
        await categoriesAPI.create(payload);
        setSuccess('Category created successfully!');
      }

      // Navigate back after short delay
      setTimeout(() => navigate('/dashboard/categories'), 1500);
    } catch (err) {
      console.error('Error saving category:', err);
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.code?.[0] ||
                          err.response?.data?.name?.[0] ||
                          err.response?.data?.detail ||
                          err.response?.data?.non_field_errors?.[0] ||
                          'Failed to save category';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const selectedTracking = trackingTypes.find(t => t.value === formData.tracking_type);

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
            onClick={() => navigate('/dashboard/categories')}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {isEditMode ? 'Edit Category' : 'Create New Category'}
            </h1>
            <p className="text-xs text-gray-600 mt-0">
              {isEditMode ? 'Update category information' : 'Add a new category for items'}
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
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Furniture"
                required
              />
            </div>

            {/* Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Category Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                placeholder="FRN"
                required
                disabled={isEditMode}
              />
              {isEditMode && (
                <p className="text-xs text-gray-500 mt-0.5">Code cannot be changed</p>
              )}
            </div>

            {/* Parent Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Parent Category
              </label>
              <select
                name="parent_category"
                value={formData.parent_category}
                onChange={handleChange}
                disabled={isEditMode}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
              >
                <option value="">None (Broader Category)</option>
                {broaderCategories.filter(cat => cat.id !== parseInt(id)).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-0.5">
                {formData.parent_category ? 'Sub-category of selected parent' : 'Top-level broader category'}
              </p>
            </div>

            {/* Tracking Type - Only for broader categories */}
            {!formData.parent_category && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Tracking Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="tracking_type"
                  value={formData.tracking_type}
                  onChange={handleChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  {trackingTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {selectedTracking && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedTracking.description}
                  </p>
                )}
              </div>
            )}

            {/* Tracking Type Display - For sub-categories (inherited) */}
            {formData.parent_category && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Tracking Type (Inherited)
                </label>
                <input
                  type="text"
                  value={
                    formData.tracking_type
                      ? (trackingTypes.find(t => t.value === formData.tracking_type)?.label || formData.tracking_type)
                      : 'Loading...'
                  }
                  disabled
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedParent ? `Inherited from ${selectedParent.name}` : 'Inherited from parent category'}
                </p>
              </div>
            )}

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter category description"
              />
            </div>
          </div>
        </div>

        {/* Depreciation Settings - Only for sub-categories of Fixed Assets (INDIVIDUAL tracking) */}
        {formData.parent_category && formData.tracking_type === 'INDIVIDUAL' && (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <h2 className="text-xs font-semibold text-gray-900 mb-2">
              Depreciation Settings
              <span className="ml-2 text-xs font-normal text-gray-600">(For Fixed Assets - INDIVIDUAL Tracking)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Depreciation Rate */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Depreciation Rate (%)
                </label>
                <input
                  type="number"
                  name="depreciation_rate"
                  value={formData.depreciation_rate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Annual depreciation rate for this sub-category
                </p>
              </div>

              {/* Depreciation Method */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Depreciation Method
                </label>
                <select
                  name="depreciation_method"
                  value={formData.depreciation_method}
                  onChange={handleChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {depreciationMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-0.5">
                  {depreciationMethods.find(m => m.value === formData.depreciation_method)?.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Messages Based on Tracking Type and Hierarchy */}
        {!formData.parent_category && (
          <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Broader Category:</strong> This is a top-level category that defines the tracking method.
              Create sub-categories under this to organize specific item types. Items can only be created for sub-categories.
            </p>
          </div>
        )}

        {formData.parent_category && selectedParent && (
          <div className="bg-purple-50 border border-purple-200 p-2 rounded-lg">
            <p className="text-xs text-purple-800">
              <strong>Sub-Category of {selectedParent.name}:</strong> This sub-category inherits{' '}
              {trackingTypes.find(t => t.value === formData.tracking_type)?.label} tracking.
              Items will be created under this sub-category.
            </p>
          </div>
        )}

        {/* Status & Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="text-xs font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigate('/dashboard/categories')}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : (isEditMode ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;