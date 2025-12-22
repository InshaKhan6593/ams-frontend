// src/pages/Items/ItemForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Package, Box, Layers } from 'lucide-react';
import { itemsAPI, categoriesAPI } from '../../api/items';
import { locationsAPI } from '../../api/locations';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Select tracking type (only for new items)
  const [selectedTrackingType, setSelectedTrackingType] = useState(null);
  const [showTypeSelection, setShowTypeSelection] = useState(!isEditMode);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    description: '',
    acct_unit: '',
    specifications: '',
    default_location: '',
    reorder_level: 0,
    reorder_quantity: 0,
    minimum_stock_alert: 0,
    requires_maintenance: false,
    maintenance_interval_days: '',
    requires_expiry_tracking: false,
    shelf_life_days: '',
    is_active: true,
  });

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Tracking type options
  const trackingTypes = [
    { 
      value: 'INDIVIDUAL', 
      label: 'Fixed Asset',
      description: 'Individual items tracked with QR codes',
      icon: Box,
      color: 'purple',
      examples: 'Furniture, Computers, Equipment'
    },
    { 
      value: 'BATCH', 
      label: 'Perishable',
      description: 'Batch tracking with expiry dates (FIFO)',
      icon: Layers,
      color: 'green',
      examples: 'Medicines, Food, Chemicals'
    },
    { 
      value: 'BULK', 
      label: 'Consumable',
      description: 'Bulk quantity tracking',
      icon: Package,
      color: 'blue',
      examples: 'Office supplies, Spare parts, Raw materials'
    },
  ];

  useEffect(() => {
    fetchLocations();
    if (isEditMode) {
      fetchItem();
    }
  }, [id]);

  useEffect(() => {
    // Fetch categories when tracking type is selected
    if (selectedTrackingType) {
      fetchCategories(selectedTrackingType);
    }
  }, [selectedTrackingType]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const data = await itemsAPI.get(id);
      
      // Set the tracking type from the item's category
      setSelectedTrackingType(data.category_tracking_type);
      setShowTypeSelection(false);
      
      setFormData({
        name: data.name || '',
        code: data.code || '',
        category: data.category || '',
        description: data.description || '',
        acct_unit: data.acct_unit || '',
        specifications: data.specifications || '',
        default_location: data.default_location || '',
        reorder_level: data.reorder_level || 0,
        reorder_quantity: data.reorder_quantity || 0,
        minimum_stock_alert: data.minimum_stock_alert || 0,
        requires_maintenance: data.requires_maintenance || false,
        maintenance_interval_days: data.maintenance_interval_days || '',
        requires_expiry_tracking: data.requires_expiry_tracking || false,
        shelf_life_days: data.shelf_life_days || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
      });
      
      // Fetch categories for this tracking type
      await fetchCategories(data.category_tracking_type);
      setError('');
    } catch (err) {
      setError('Failed to load item details');
      console.error('Error fetching item:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (trackingType) => {
    try {
      setLoadingData(true);
      const data = await categoriesAPI.getAll();
      // Filter for sub-categories only (must have parent_category) with matching tracking type
      // Items can ONLY be created for sub-categories, not broader categories
      const filtered = data.filter(cat =>
        cat.is_active &&
        cat.inherited_tracking_type === trackingType &&  // Use inherited_tracking_type for sub-categories
        cat.parent_category  // Only sub-categories (not broader categories)
      );
      setCategories(filtered);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoadingData(true);
      const data = await locationsAPI.getLocations();
      // Only show standalone locations as per the model requirement
      setLocations(data.filter(loc => loc.is_standalone && loc.is_active));
    } catch (err) {
      console.error('Error fetching locations:', err);
      setLocations([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleTrackingTypeSelect = (type) => {
    setSelectedTrackingType(type);
    setShowTypeSelection(false);
    // Reset category when changing tracking type
    setFormData(prev => ({ ...prev, category: '' }));
  };

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
      const payload = {
        ...formData,
        // Convert string numbers to integers
        reorder_level: parseInt(formData.reorder_level) || 0,
        reorder_quantity: parseInt(formData.reorder_quantity) || 0,
        minimum_stock_alert: parseInt(formData.minimum_stock_alert) || 0,
        maintenance_interval_days: formData.maintenance_interval_days ? parseInt(formData.maintenance_interval_days) : null,
        shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null,
      };

      if (isEditMode) {
        await itemsAPI.update(id, payload);
        setSuccess('Item updated successfully!');
      } else {
        await itemsAPI.create(payload);
        setSuccess('Item created successfully!');
      }

      // Navigate back after short delay
      setTimeout(() => navigate('/dashboard/items'), 1500);
    } catch (err) {
      console.error('Error saving item:', err);
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.code?.[0] ||
                          err.response?.data?.name?.[0] ||
                          err.response?.data?.detail ||
                          'Failed to save item';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === parseInt(formData.category));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Step 1: Show tracking type selection for new items
  if (showTypeSelection) {
    return (
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard/items')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-900">
                Create New Item
              </h1>
              <p className="text-xs text-gray-600 mt-0">
                Step 1: Select item type
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {trackingTypes.map((type) => {
            const Icon = type.icon;
            const colorClasses = {
              purple: 'border-purple-300 hover:border-purple-500 hover:bg-purple-50',
              green: 'border-green-300 hover:border-green-500 hover:bg-green-50',
              blue: 'border-blue-300 hover:border-blue-500 hover:bg-blue-50',
            };
            const iconColors = {
              purple: 'text-purple-600',
              green: 'text-green-600',
              blue: 'text-blue-600',
            };

            return (
              <button
                key={type.value}
                onClick={() => handleTrackingTypeSelect(type.value)}
                className={`bg-white rounded-lg border-2 p-4 text-left transition-all ${colorClasses[type.color]}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-8 h-8 ${iconColors[type.color]} flex-shrink-0`} />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      {type.label}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {type.description}
                    </p>
                    <p className="text-xs text-gray-500 italic">
                      e.g., {type.examples}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 2: Show item form
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!isEditMode && selectedTrackingType) {
                setShowTypeSelection(true);
              } else {
                navigate('/dashboard/items');
              }
            }}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {isEditMode ? 'Edit Item' : 'Create New Item'}
            </h1>
            <p className="text-xs text-gray-600 mt-0">
              {isEditMode ? 'Update item information' : 'Step 2: Fill in item details'}
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
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Office Chair"
                required
              />
            </div>

            {/* Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Item Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                placeholder="ITM-001"
                required
                disabled={isEditMode}
              />
              {isEditMode && (
                <p className="text-xs text-gray-500 mt-0.5">Code cannot be changed</p>
              )}
            </div>

            {/* Category - filtered by tracking type (sub-categories only) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Sub-Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={categories.length === 0}
              >
                <option value="">Select sub-category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.parent_category_name ? `${category.parent_category_name} → ` : ''}{category.name}
                  </option>
                ))}
              </select>
              {selectedTrackingType && categories.length === 0 && (
                <p className="text-xs text-amber-600 mt-0.5">
                  ⚠️ No sub-categories available for {trackingTypes.find(t => t.value === selectedTrackingType)?.label}.
                  Please create a sub-category first.
                </p>
              )}
              {selectedTrackingType && categories.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Items must be created under sub-categories (not broader categories)
                </p>
              )}
            </div>

            {/* Accounting Unit */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Accounting Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="acct_unit"
                value={formData.acct_unit}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={
                  selectedTrackingType === 'INDIVIDUAL' ? 'pieces, units' :
                  selectedTrackingType === 'BATCH' ? 'boxes, vials, bottles' :
                  'kg, liters, pieces'
                }
                required
              />
            </div>

            {/* Default Location */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Default Location (Standalone) <span className="text-red-500">*</span>
              </label>
              <select
                name="default_location"
                value={formData.default_location}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select default location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-0.5">
                Only standalone locations can be selected
              </p>
            </div>
          </div>
        </div>

        {/* Stock Management - Only for BULK and BATCH */}
        {(selectedTrackingType === 'BULK' || selectedTrackingType === 'BATCH') && (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <h2 className="text-xs font-semibold text-gray-900 mb-2">Stock Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Reorder Level */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Reorder Level
                </label>
                <input
                  type="number"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Alert when stock falls below this level
                </p>
              </div>

              {/* Reorder Quantity */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Reorder Quantity
                </label>
                <input
                  type="number"
                  name="reorder_quantity"
                  value={formData.reorder_quantity}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Suggested quantity to reorder
                </p>
              </div>

              {/* Minimum Stock Alert */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Minimum Stock Alert
                </label>
                <input
                  type="number"
                  name="minimum_stock_alert"
                  value={formData.minimum_stock_alert}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Critical stock level
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info for INDIVIDUAL tracking */}
        {selectedTrackingType === 'INDIVIDUAL' && (
          <div className="bg-purple-50 border border-purple-200 p-2 rounded-lg">
            <p className="text-xs text-purple-800">
              <strong>Fixed Asset:</strong> Each item will be tracked individually with a unique QR code. 
              Stock management is handled per instance.
            </p>
          </div>
        )}

        {/* Additional Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">Additional Details</h2>
          
          <div className="space-y-2">
            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter item description"
              />
            </div>

            {/* Specifications */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Specifications
              </label>
              <textarea
                name="specifications"
                value={formData.specifications}
                onChange={handleChange}
                rows="2"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter technical specifications"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Settings - Only for INDIVIDUAL tracking */}
        {selectedTrackingType === 'INDIVIDUAL' && (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <h2 className="text-xs font-semibold text-gray-900 mb-2">Maintenance Settings</h2>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="requires_maintenance"
                  checked={formData.requires_maintenance}
                  onChange={handleChange}
                  className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label className="text-xs font-medium text-gray-700">
                  Requires Periodic Maintenance
                </label>
              </div>

              {formData.requires_maintenance && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Maintenance Interval (Days)
                  </label>
                  <input
                    type="number"
                    name="maintenance_interval_days"
                    value={formData.maintenance_interval_days}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 30, 90, 365"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">
                    Number of days between scheduled maintenance
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expiry Tracking - Only for BATCH tracking */}
        {selectedTrackingType === 'BATCH' && (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <h2 className="text-xs font-semibold text-gray-900 mb-2">Expiry & Shelf Life Settings</h2>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="requires_expiry_tracking"
                  checked={formData.requires_expiry_tracking}
                  onChange={handleChange}
                  className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label className="text-xs font-medium text-gray-700">
                  Requires Expiry Tracking (FIFO)
                </label>
              </div>

              {formData.requires_expiry_tracking && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Default Shelf Life (Days)
                  </label>
                  <input
                    type="number"
                    name="shelf_life_days"
                    value={formData.shelf_life_days}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 7, 30, 90, 365"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">
                    Default shelf life for calculating expiry dates
                  </p>
                </div>
              )}
            </div>
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
                onClick={() => navigate('/dashboard/items')}
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

export default ItemForm;