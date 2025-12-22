// src/pages/InterStoreRequests/RequestForm.jsx - UPDATED VERSION
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, AlertCircle, Save, Plus, X, Building2, Search } from 'lucide-react';
import { interStoreRequestsAPI } from '../../api/interStoreRequests';
import { locationsAPI } from '../../api/locations';
import { itemsAPI, categoriesAPI } from '../../api/items';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RequestForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Available stores and fulfilling options
  const [requestingStores, setRequestingStores] = useState([]);
  const [fulfillingOptions, setFulfillingOptions] = useState([]);

  // Items and categories
  const [categories, setCategories] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    requesting_store: '',
    fulfilling_store: '',
    purpose: '',
    remarks: '',
    priority: 'NORMAL',
  });

  // Items list - now with item selection instead of description
  const [items, setItems] = useState([
    {
      category: '',
      item: '',
      requested_quantity: '',
      notes: ''
    }
  ]);

  // Category search state for each item
  const [categorySearches, setCategorySearches] = useState([]);

  // Selected stores info
  const [selectedRequestingStore, setSelectedRequestingStore] = useState(null);
  const [selectedFulfillingOption, setSelectedFulfillingOption] = useState(null);
  const [transferType, setTransferType] = useState('');

  useEffect(() => {
    fetchAvailableData();
  }, []);

  useEffect(() => {
    if (formData.requesting_store) {
      fetchFulfillingOptions(formData.requesting_store);
    } else {
      setFulfillingOptions([]);
      setSelectedRequestingStore(null);
    }
  }, [formData.requesting_store]);

  useEffect(() => {
    if (formData.fulfilling_store && fulfillingOptions.length > 0) {
      const option = fulfillingOptions.find(opt => opt.value === parseInt(formData.fulfilling_store));
      if (option) {
        setSelectedFulfillingOption(option);
        setTransferType(option.transferType);
      }
    } else {
      setSelectedFulfillingOption(null);
      setTransferType('');
    }
  }, [formData.fulfilling_store, fulfillingOptions]);

  const fetchAvailableData = async () => {
    try {
      setLoading(true);
      const [locations, categoriesData, itemsData] = await Promise.all([
        locationsAPI.getAll({ is_store: 'true' }), // Only get stores
        categoriesAPI.getAll(),
        itemsAPI.getAll()
      ]);

      // Get user's accessible stores for requesting (from API response)
      const storesArray = Array.isArray(locations) ? locations : locations.results || [];
      setRequestingStores(storesArray.filter(store => store.is_active));

      // Set all categories (both broader and sub-categories)
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : categoriesData.results || [];
      setCategories(categoriesArray);

      // Set items
      const itemsArray = Array.isArray(itemsData) ? itemsData : itemsData.results || [];
      console.log('[RequestForm] Available items loaded:', itemsArray.length, 'items');
      console.log('[RequestForm] Sample item structure:', itemsArray[0]);
      setAvailableItems(itemsArray);

    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFulfillingOptions = async (requestingStoreId) => {
    try {
      const data = await interStoreRequestsAPI.getValidFulfillingStores(requestingStoreId);

      // Set requesting store info
      setSelectedRequestingStore(data.requesting_store);

      const options = [];

      // Add internal stores
      data.internal_stores.forEach(store => {
        options.push({
          type: 'store',
          id: store.id,
          value: store.id,
          name: store.name,
          code: store.code,
          transferType: 'INTERNAL',
          is_main_store: store.is_main_store,
          hierarchy_path: store.hierarchy_path
        });
      });

      // Add upward stores (main stores from other locations)
      data.upward_stores.forEach(store => {
        const parentLocation = store.parent_location;
        options.push({
          type: 'location', // Display as location for better UX
          id: store.id,
          value: store.id,
          name: parentLocation ? parentLocation.name : store.name,
          code: parentLocation ? parentLocation.code : store.code,
          storeName: store.name,
          storeCode: store.code,
          transferType: 'UPWARD',
          is_main_store: true,
          hierarchy_path: store.hierarchy_path
        });
      });

      setFulfillingOptions(options);
      setError('');
    } catch (err) {
      setError('Failed to load fulfilling stores');
      console.error('Error fetching fulfilling stores:', err);
      setFulfillingOptions([]);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Reset item when category changes
    if (field === 'category') {
      newItems[index].item = '';
    }

    setItems(newItems);
  };

  const handleCategorySearch = (index, searchTerm) => {
    const newSearches = [...categorySearches];
    newSearches[index] = searchTerm;
    setCategorySearches(newSearches);
  };

  const getFilteredCategories = (searchTerm) => {
    if (!searchTerm) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(term) ||
      cat.code?.toLowerCase().includes(term) ||
      cat.tracking_type?.toLowerCase().includes(term)
    );
  };

  const getItemsForCategory = (categoryId) => {
    if (!categoryId) return [];
    const parsedCategoryId = parseInt(categoryId);
    const filtered = availableItems.filter(item => {
      // Handle case where category might be an object with id, or just an id
      const itemCategoryId = typeof item.category === 'object' ? item.category?.id : item.category;
      return itemCategoryId === parsedCategoryId && (item.is_active !== false);
    });
    console.log('[RequestForm] getItemsForCategory:', categoryId, '-> Found', filtered.length, 'items');
    return filtered;
  };

  const getCategoryDisplay = (category) => {
    if (!category) return '';
    const parentName = category.parent_category_name ? `${category.parent_category_name} > ` : '';
    const typeLabel = category.tracking_type ? ` (${category.tracking_type})` : '';
    return `${parentName}${category.name}${typeLabel}`;
  };

  const addItem = () => {
    setItems([...items, {
      category: '',
      item: '',
      requested_quantity: '',
      notes: ''
    }]);
    setCategorySearches([...categorySearches, '']);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      const newSearches = categorySearches.filter((_, i) => i !== index);
      setCategorySearches(newSearches);
    }
  };

  const validateForm = () => {
    if (!formData.requesting_store) {
      setError('Please select requesting store');
      return false;
    }
    if (!formData.fulfilling_store) {
      setError('Please select fulfilling store/location');
      return false;
    }
    if (!formData.purpose.trim()) {
      setError('Please provide purpose of request');
      return false;
    }

    const validItems = items.filter(item =>
      item.item && item.requested_quantity
    );

    if (validItems.length === 0) {
      setError('Please add at least one item with item selection and quantity');
      return false;
    }

    // Validate all items have required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.item && !item.requested_quantity) {
        setError(`Item ${i + 1}: Please specify quantity`);
        return false;
      }
      if (item.requested_quantity && !item.item) {
        setError(`Item ${i + 1}: Please select an item`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const validItems = items
        .filter(item => item.item && item.requested_quantity)
        .map(item => {
          const itemData = {
            item: parseInt(item.item),
            requested_quantity: parseInt(item.requested_quantity)
          };

          // Only include notes if it has a value
          if (item.notes && item.notes.trim()) {
            itemData.notes = item.notes.trim();
          }

          return itemData;
        });

      const requestData = {
        ...formData,
        items: validItems
      };

      console.log('Sending request data:', JSON.stringify(requestData, null, 2));

      await interStoreRequestsAPI.create(requestData);
      setSuccess('Request created successfully!');

      setTimeout(() => {
        navigate('/dashboard/store-requests');
      }, 1000);

    } catch (err) {
      console.error('Full error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Full error object:', JSON.stringify(err.response?.data, null, 2));

      // Extract error message
      let errorMessage = 'Failed to create request';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.items) {
          // Handle item-level validation errors
          errorMessage = 'Validation error: ' + JSON.stringify(err.response.data.items, null, 2);
        } else {
          // Show full error object for debugging
          errorMessage = 'Server error: ' + JSON.stringify(err.response.data, null, 2);
        }
      }

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-2">
      <div>
        <h1 className="text-sm font-bold text-gray-900">New Inter-Store Request</h1>
        <p className="text-xs text-gray-600 mt-0">Request items from other stores or locations</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs flex items-start gap-2">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-2 py-1.5 rounded-lg text-xs">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Requesting Store */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            <MapPin className="inline h-3 w-3 mr-1" />
            Requesting Store <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.requesting_store}
            onChange={(e) => handleChange('requesting_store', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Select your store</option>
            {requestingStores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name} {store.is_main_store ? '(Main Store)' : ''}
              </option>
            ))}
          </select>
          {selectedRequestingStore && (
            <div className="mt-1 p-1.5 bg-blue-50 rounded text-xs text-blue-700">
              <strong>Location:</strong> {selectedRequestingStore.hierarchy_path || selectedRequestingStore.code}
              {selectedRequestingStore.is_main_store && (
                <span className="ml-2 text-blue-800">• Can request from other locations</span>
              )}
            </div>
          )}
        </div>

        {/* Fulfilling Store/Location */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            <Building2 className="inline h-3 w-3 mr-1" />
            Request From <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.fulfilling_store}
            onChange={(e) => handleChange('fulfilling_store', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            disabled={!formData.requesting_store}
          >
            <option value="">
              {!formData.requesting_store
                ? 'Select requesting store first'
                : fulfillingOptions.length === 0
                ? 'No available options'
                : 'Select store or location'}
            </option>

            {/* Group by transfer type */}
            {fulfillingOptions.filter(opt => opt.transferType === 'INTERNAL').length > 0 && (
              <optgroup label="━━ Internal (Same Location) ━━">
                {fulfillingOptions
                  .filter(opt => opt.transferType === 'INTERNAL')
                  .map(option => (
                    <option key={option.value} value={option.value}>
                      {option.name} {option.is_main_store ? '(Main)' : ''}
                    </option>
                  ))}
              </optgroup>
            )}

            {fulfillingOptions.filter(opt => opt.transferType === 'UPWARD').length > 0 && (
              <optgroup label="━━ Upward (Other Locations' Main Stores) ━━">
                {fulfillingOptions
                  .filter(opt => opt.transferType === 'UPWARD')
                  .map(option => (
                    <option key={option.value} value={option.value}>
                      {option.name} → {option.storeName}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>

          {!formData.requesting_store && (
            <p className="text-xs text-gray-500 mt-0.5">Select requesting store first</p>
          )}

          {selectedFulfillingOption && (
            <div className="mt-1 p-1.5 bg-green-50 rounded text-xs text-green-700">
              <strong>Type:</strong> {transferType === 'INTERNAL' ? 'Internal Transfer (Same Location)' : 'Upward Transfer (Between Locations)'}
              <br />
              {selectedFulfillingOption.type === 'location' ? (
                <>
                  <strong>Location:</strong> {selectedFulfillingOption.name} ({selectedFulfillingOption.code})
                  <br />
                  <strong>Fulfilling Store:</strong> {selectedFulfillingOption.storeName} ({selectedFulfillingOption.storeCode})
                </>
              ) : (
                <>
                  <strong>Target Store:</strong> {selectedFulfillingOption.name} ({selectedFulfillingOption.code})
                </>
              )}
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {/* Purpose */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            Purpose of Request <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows="2"
            placeholder="Describe the purpose of this request..."
            required
          />
        </div>

        {/* Remarks */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            Additional Remarks
          </label>
          <textarea
            value={formData.remarks}
            onChange={(e) => handleChange('remarks', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows="2"
            placeholder="Any additional notes..."
          />
        </div>

        {/* Items List - NEW with item selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-700">
              <Package className="inline h-3 w-3 mr-1" />
              Items Requested <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-3 w-3" />
              Add Item
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => {
              const filteredCategories = getFilteredCategories(categorySearches[index] || '');
              const itemOptions = getItemsForCategory(item.category);
              const selectedItem = availableItems.find(i => i.id === parseInt(item.item));
              const selectedCategory = categories.find(c => c.id === parseInt(item.category));

              return (
                <div key={index} className="p-2 border border-gray-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Item {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Category with Search */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">
                      Category <span className="text-red-500">*</span>
                    </label>

                    {/* Search Input */}
                    <div className="relative mb-1">
                      <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearches[index] || ''}
                        onChange={(e) => handleCategorySearch(index, e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    {/* Category Dropdown */}
                    <select
                      value={item.category}
                      onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-32 overflow-y-auto"
                      size="4"
                    >
                      <option value="">Select category...</option>
                      {filteredCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {getCategoryDisplay(cat)}
                        </option>
                      ))}
                    </select>

                    {filteredCategories.length === 0 && categorySearches[index] && (
                      <p className="text-xs text-gray-500 mt-0.5">No categories match your search</p>
                    )}
                  </div>

                  {/* Selected Category Info */}
                  {selectedCategory && (
                    <div className="p-1.5 bg-purple-50 rounded text-xs text-purple-700">
                      <strong>{selectedCategory.name}</strong>
                      {selectedCategory.parent_category_name && (
                        <span className="text-purple-600"> (under {selectedCategory.parent_category_name})</span>
                      )}
                      <br />
                      <span className="text-xs text-purple-600">
                        Tracking: {selectedCategory.tracking_type || selectedCategory.inherited_tracking_type || 'Inherited'}
                      </span>
                    </div>
                  )}

                  {/* Item Selection */}
                  {item.category && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-0.5">Item <span className="text-red-500">*</span></label>
                      <select
                        value={item.item}
                        onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required={items.filter(i => i.item || i.requested_quantity).length > 0}
                      >
                        <option value="">Select item...</option>
                        {itemOptions.map(itemOption => (
                          <option key={itemOption.id} value={itemOption.id}>
                            {itemOption.name} ({itemOption.code})
                          </option>
                        ))}
                      </select>
                      {itemOptions.length === 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">No items in this category</p>
                      )}
                    </div>
                  )}

                  {/* Selected Item Info */}
                  {selectedItem && (
                    <div className="p-1.5 bg-blue-50 rounded text-xs text-blue-700">
                      <strong>{selectedItem.name}</strong> ({selectedItem.code})
                      <br />
                      <span className="text-xs text-blue-600">
                        Tracking: {selectedItem.tracking_type_display || selectedItem.category_tracking_type || 'N/A'}
                      </span>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">Quantity <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={item.requested_quantity}
                      onChange={(e) => handleItemChange(index, 'requested_quantity', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter quantity..."
                      min="1"
                      required={items.filter(i => i.item || i.requested_quantity).length > 0}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">Notes (optional)</label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Any specific requirements..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                Create Request
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/store-requests')}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;
