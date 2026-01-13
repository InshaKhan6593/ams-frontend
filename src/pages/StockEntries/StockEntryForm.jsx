// src/pages/StockEntries/StockEntryForm.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, MapPin, Calendar, AlertCircle, Save, ArrowRight, X, ArrowUp, Search, ChevronDown } from 'lucide-react';
import { stockEntriesAPI } from '../../api/stockEntries';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StockEntryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    entry_type: 'ISSUE',
    from_location: '',
    to_location: '',
    item: '',
    quantity: 1,
    is_temporary: false,
    expected_return_date: '',
    temporary_recipient: '',
    purpose: '',
    remarks: '',
  });

  // For RECEIPT entries, we need source location options
  const [receiptSourceStores, setReceiptSourceStores] = useState([]);
  const [receiptCanReceiveUpward, setReceiptCanReceiveUpward] = useState(false);
  const [receiptUpwardStores, setReceiptUpwardStores] = useState([]);

  // Options from API
  const [fromLocations, setFromLocations] = useState([]);
  const [internalTargets, setInternalTargets] = useState([]);
  const [standaloneTargets, setStandaloneTargets] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [canIssueUpward, setCanIssueUpward] = useState(false);
  const [upwardTarget, setUpwardTarget] = useState(null);

  // Selected item details
  const [selectedItem, setSelectedItem] = useState(null);
  const [trackingType, setTrackingType] = useState(null);

  // For INDIVIDUAL tracking
  const [availableInstances, setAvailableInstances] = useState([]);
  const [selectedInstances, setSelectedInstances] = useState([]);

  // For BATCH tracking (FIFO)
  const [availableBatches, setAvailableBatches] = useState([]);
  const [batchAllocations, setBatchAllocations] = useState([]);

  // For BULK tracking
  const [availableBulkBatches, setAvailableBulkBatches] = useState([]);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [reservedQuantity, setReservedQuantity] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [inUseQuantity, setInUseQuantity] = useState(0);
  const [sourceLocationIsStore, setSourceLocationIsStore] = useState(true);

  // For searchable item dropdown
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const itemDropdownRef = useRef(null);

  useEffect(() => {
    if (isEditMode) {
      fetchStockEntry();
    } else {
      fetchCreationOptions();
    }
  }, [id]);

  // Auto-select location when there's only one option (for RECEIPT entries)
  useEffect(() => {
    if (!isEditMode && formData.entry_type === 'RECEIPT' && fromLocations.length === 1 && !formData.to_location) {
      console.log('[AUTO-SELECT] Setting to_location for RECEIPT entry:', fromLocations[0].id);
      handleChange('to_location', fromLocations[0].id);
    }
  }, [formData.entry_type, fromLocations, isEditMode]);

  useEffect(() => {
    // Fetch item stock for both ISSUE and RECEIPT entries
    // (both need to check available stock at source location)
    if (formData.from_location && formData.item) {
      console.log('Triggering fetchItemStock with:', {
        entry_type: formData.entry_type,
        from_location: formData.from_location,
        item: formData.item
      });
      fetchItemStock();
    }
  }, [formData.entry_type, formData.from_location, formData.item]);

  // Close item dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
        setShowItemDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStockEntry = async () => {
    try {
      setLoading(true);
      const data = await stockEntriesAPI.get(id);
      
      // Populate form data
      setFormData({
        entry_type: data.entry_type,
        from_location: data.from_location?.id || '',
        to_location: data.to_location?.id || '',
        item: data.item?.id || '',
        quantity: data.quantity,
        is_temporary: data.is_temporary,
        expected_return_date: data.expected_return_date || '',
        temporary_recipient: data.temporary_recipient || '',
        purpose: data.purpose || '',
        remarks: data.remarks || '',
      });
      
      setSelectedItem(data.item);
      setTrackingType(data.item_tracking_type);

      // Set search query for item dropdown
      if (data.item) {
        setItemSearchQuery(data.item.name);
      }

      // Load instances or batch allocations if applicable
      if (data.instances && data.instances.length > 0) {
        setSelectedInstances(data.instances.map(i => i.id));
      }
      if (data.batch_allocations && data.batch_allocations.length > 0) {
        setBatchAllocations(data.batch_allocations);
      }

      await fetchCreationOptions();
    } catch (err) {
      setError('Failed to load stock entry');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreationOptions = async () => {
    try {
      setLoading(true);
      const data = await stockEntriesAPI.getCreationOptions();

      console.log('[CREATION OPTIONS] Data received:', data);
      console.log('[CREATION OPTIONS] from_locations count:', data.from_locations?.length || 0);
      console.log('[CREATION OPTIONS] available_items count:', data.available_items?.length || 0);

      setFromLocations(data.from_locations || []);
      setInternalTargets(data.internal_targets || []);
      setStandaloneTargets(data.standalone_targets || []);
      setAvailableItems(data.available_items || []);
      setUserRole(data.user_role);
      setCanIssueUpward(data.can_issue_upward || false);
      setUpwardTarget(data.upward_target);

      // Check if user has no locations assigned
      if (!data.from_locations || data.from_locations.length === 0) {
        setError('No locations found. Please contact admin to assign you to a store.');
        return;
      }

      // Auto-populate from_location and to_location with user's default location
      // Only for ISSUE entries (RECEIPT entries handle location selection differently)
      if (data.default_from_location && !isEditMode && formData.entry_type === 'ISSUE') {
        setFormData(prev => ({
          ...prev,
          from_location: data.default_from_location.id,
        }));
      }

      // For RECEIPT entries, we'll use fromLocations directly
    } catch (err) {
      setError('Failed to load creation options');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptSourceStores = async (receivingStoreId) => {
    try {
      setLoading(true);
      console.log('[RECEIPT] fetchReceiptSourceStores called with:', receivingStoreId);
      console.log('[RECEIPT] fromLocations array:', fromLocations);

      // Find the receiving store details
      const receivingStore = fromLocations.find(loc => loc.id === parseInt(receivingStoreId));

      if (!receivingStore) {
        console.error('[RECEIPT] ERROR: Receiving store not found in fromLocations');
        console.error('[RECEIPT] Looking for ID:', receivingStoreId);
        console.error('[RECEIPT] Available IDs:', fromLocations.map(loc => loc.id));
        setError('Error: Could not find receiving store details. Please refresh the page.');
        setLoading(false);
        return;
      }

      console.log('[RECEIPT] Receiving store:', receivingStore);

      // Internal locations: ALL locations in the same parent location (not just stores)
      // This includes both stores and non-store locations
      const internalSources = [];

      // Add other stores in the same parent
      const otherStoresInParent = fromLocations.filter(loc =>
        loc.id !== receivingStore.id &&
        loc.parent_location_id === receivingStore.parent_location_id
      );
      internalSources.push(...otherStoresInParent);

      // Add non-store internal locations (from internal_targets)
      const internalNonStores = internalTargets.filter(loc =>
        loc.parent_location_id === receivingStore.parent_location_id ||
        (loc.parent_location && loc.parent_location.id === receivingStore.parent_location_id)
      );
      internalSources.push(...internalNonStores);

      setReceiptSourceStores(internalSources);
      console.log('[RECEIPT] Internal sources count:', internalSources.length);
      console.log('[RECEIPT] Internal sources:', internalSources);

      // Upward locations: main stores from other standalone locations (only if receiving store is a main store)
      let upwardStoresCount = 0;
      if (receivingStore.is_main_store) {
        console.log('[RECEIPT] Receiving store IS a main store, checking for upward stores...');
        console.log('[RECEIPT] Receiving store parent_location_id:', receivingStore.parent_location_id);

        // Get all other standalone locations' main stores
        const upwardStores = fromLocations.filter(loc =>
          loc.is_main_store &&
          loc.parent_location_id !== receivingStore.parent_location_id
        );
        upwardStoresCount = upwardStores.length;
        setReceiptUpwardStores(upwardStores);
        setReceiptCanReceiveUpward(upwardStores.length > 0);
        console.log('[RECEIPT] Upward stores count:', upwardStores.length);
        console.log('[RECEIPT] Upward stores:', upwardStores);
      } else {
        console.log('[RECEIPT] Receiving store is NOT a main store, no upward stores');
        setReceiptUpwardStores([]);
        setReceiptCanReceiveUpward(false);
      }

      // Final check: if no sources at all, show warning
      const totalSources = internalSources.length + upwardStoresCount;
      console.log('[RECEIPT] Total available source locations:', totalSources);
      if (totalSources === 0) {
        console.warn('[RECEIPT] WARNING: No source locations available for receipt!');
        setError('No source locations available for receipt. You may need to use a different entry type or contact your admin.');
      }
    } catch (err) {
      console.error('Failed to fetch receipt source stores:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemStock = async () => {
    try {
      const data = await stockEntriesAPI.getItemStock(formData.from_location, formData.item);
      console.log('Item stock data received:', data); // Debug log
      setTrackingType(data.tracking_type);

      if (data.tracking_type === 'INDIVIDUAL') {
        console.log('Setting INDIVIDUAL instances:', data.instances); // Debug log
        setAvailableInstances(data.instances || []);
        setSelectedInstances([]);
      } else if (data.tracking_type === 'BATCH') {
        console.log('Setting BATCH batches:', data.batches); // Debug log
        setAvailableBatches(data.batches || []);
        setBatchAllocations([]);
      } else if (data.tracking_type === 'BULK') {
        console.log('BULK data received:', data); // Debug log
        console.log('Available fields:', {
          available_quantity: data.available_quantity,
          total_quantity: data.total_quantity,
          reserved_quantity: data.reserved_quantity,
          in_use_quantity: data.in_use_quantity,
          is_store: data.is_store
        });

        // Store the raw quantities for display
        setTotalQuantity(data.total_quantity || 0);
        setReservedQuantity(data.reserved_quantity || 0);
        setInUseQuantity(data.in_use_quantity || 0);
        setSourceLocationIsStore(data.is_store !== undefined ? data.is_store : true);

        // For BULK items, use available (unreserved) quantity at this location
        // Try multiple field names that backend might use
        const availableQty = data.available_quantity !== undefined
          ? data.available_quantity
          : data.available !== undefined
            ? data.available
            : (data.total_quantity || 0) - (data.reserved_quantity || 0);

        console.log('Computed available quantity:', availableQty);
        setTotalAvailable(availableQty);
        // BULK items don't use batches conceptually, but backend might return batch data for tracking purposes
        setAvailableBulkBatches(data.batches || []);
      }
    } catch (err) {
      console.error('Failed to fetch item stock:', err);
      console.error('Error details:', err.response?.data); // More detailed error logging
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to load item stock. Please try again.');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Reset dependent fields
    if (field === 'from_location') {
      setFormData(prev => ({ ...prev, item: '', quantity: 1 }));
      setSelectedItem(null);
      setTrackingType(null);
      setSelectedInstances([]);
      setBatchAllocations([]);
      setItemSearchQuery('');
      setTotalAvailable(0);
      setReservedQuantity(0);
      setTotalQuantity(0);
    }

    if (field === 'item') {
      const item = availableItems.find(i => i.id === parseInt(value));
      setSelectedItem(item);
      setFormData(prev => ({ ...prev, quantity: 1 }));
      setSelectedInstances([]);
      setBatchAllocations([]);
    }

    // For RECEIPT entries, fetch source stores when receiving store is selected
    if (field === 'to_location' && formData.entry_type === 'RECEIPT' && value) {
      fetchReceiptSourceStores(value);
      setFormData(prev => ({ ...prev, from_location: '', item: '' }));
      setSelectedItem(null);
      setTrackingType(null);
      setItemSearchQuery('');
    }

    // Reset fields when entry type changes
    if (field === 'entry_type') {
      setFormData(prev => ({
        ...prev,
        from_location: '',
        to_location: '',
        item: '',
        quantity: 1,
        is_temporary: false,
        expected_return_date: '',
        temporary_recipient: '',
        purpose: '',
        remarks: ''
      }));
      setSelectedItem(null);
      setTrackingType(null);
      setSelectedInstances([]);
      setBatchAllocations([]);
      setItemSearchQuery('');
      setReceiptSourceStores([]);
      setReceiptUpwardStores([]);
      setReceiptCanReceiveUpward(false);

      // Log for debugging
      console.log(`Entry type changed to: ${value}`);
      console.log(`Available from_locations: ${fromLocations.length}`);
    }
  };

  // Filter items based on search query
  const getFilteredItems = () => {
    if (!itemSearchQuery.trim()) {
      return availableItems;
    }
    const query = itemSearchQuery.toLowerCase();
    return availableItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.code.toLowerCase().includes(query) ||
      item.category_name?.toLowerCase().includes(query)
    );
  };

  // Handle item selection from dropdown
  const handleItemSelect = (item) => {
    handleChange('item', item.id);
    setItemSearchQuery(item.name);
    setShowItemDropdown(false);
  };

  const handleInstanceToggle = (instanceId) => {
    setSelectedInstances(prev => {
      const newSelection = prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId];

      // Update quantity to match manual selection
      setFormData(prevForm => ({ ...prevForm, quantity: newSelection.length }));

      return newSelection;
    });
  };

  const handleQuantityChange = (value) => {
    const qty = parseInt(value) || 0;

    if (trackingType === 'INDIVIDUAL') {
      // Auto-select first N instances based on quantity
      const newSelection = availableInstances.slice(0, qty).map(i => i.id);
      setSelectedInstances(newSelection);
    }

    setFormData(prev => ({ ...prev, quantity: qty }));
  };

  const handleBatchAllocation = (batchId, quantity) => {
    const qty = parseInt(quantity) || 0;
    setBatchAllocations(prev => {
      const existing = prev.find(a => a.batch_id === batchId);
      if (existing) {
        if (qty === 0) {
          return prev.filter(a => a.batch_id !== batchId);
        }
        return prev.map(a => 
          a.batch_id === batchId ? { ...a, quantity: qty } : a
        );
      } else if (qty > 0) {
        return [...prev, { batch_id: batchId, quantity: qty }];
      }
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    // Validation for ISSUE entries
    if (formData.entry_type === 'ISSUE') {
      if (!formData.from_location || !formData.to_location) {
        setError('Please select both source and destination stores');
        return;
      }

      if (formData.from_location === formData.to_location) {
        setError('Source and destination cannot be the same');
        return;
      }

      if (trackingType === 'INDIVIDUAL') {
        if (selectedInstances.length === 0 || formData.quantity === 0) {
          setError('Please select at least one item instance (enter quantity or manually check boxes)');
          return;
        }
        if (selectedInstances.length !== formData.quantity) {
          setError(`Selected instances (${selectedInstances.length}) must match quantity (${formData.quantity})`);
          return;
        }
      }

      if (trackingType === 'BATCH') {
        if (batchAllocations.length === 0) {
          setError('Please allocate quantities from batches');
          return;
        }
        const totalAllocated = batchAllocations.reduce((sum, a) => sum + a.quantity, 0);
        if (totalAllocated === 0) {
          setError('Total quantity must be greater than 0');
          return;
        }
      }

      if (trackingType === 'BULK') {
        if (!formData.quantity || formData.quantity <= 0) {
          setError('Quantity must be greater than 0');
          return;
        }
        if (formData.quantity > totalAvailable) {
          setError(`Only ${totalAvailable} units available`);
          return;
        }
      }
    }

    // Validation for RECEIPT entries
    if (formData.entry_type === 'RECEIPT') {
      if (!formData.from_location || !formData.to_location) {
        setError('Please select both source and receiving stores');
        return;
      }

      if (formData.from_location === formData.to_location) {
        setError('Source and receiving stores cannot be the same');
        return;
      }

      if (trackingType === 'INDIVIDUAL') {
        if (selectedInstances.length === 0 || formData.quantity === 0) {
          setError('Please select at least one item instance (enter quantity or manually check boxes)');
          return;
        }
        if (selectedInstances.length !== formData.quantity) {
          setError(`Selected instances (${selectedInstances.length}) must match quantity (${formData.quantity})`);
          return;
        }
      }

      if (trackingType === 'BATCH') {
        if (batchAllocations.length === 0) {
          setError('Please allocate quantities from batches');
          return;
        }
        const totalAllocated = batchAllocations.reduce((sum, a) => sum + a.quantity, 0);
        if (totalAllocated === 0) {
          setError('Total quantity must be greater than 0');
          return;
        }
      }

      if (trackingType === 'BULK') {
        if (!formData.quantity || formData.quantity <= 0) {
          setError('Quantity must be greater than 0');
          return;
        }
        if (formData.quantity > totalAvailable) {
          setError(`Only ${totalAvailable} units available at source store`);
          return;
        }
      }
    }

    if (!formData.item) {
      setError('Please select an item from the dropdown');
      return;
    }

    if (formData.is_temporary) {
      if (!formData.expected_return_date) {
        setError('Expected return date is required for temporary issues');
        return;
      }
      if (!formData.temporary_recipient) {
        setError('Recipient name is required for temporary issues');
        return;
      }
    }

    try {
      setSaving(true);
      setError('');

      const submitData = {
        ...formData,
        to_location: parseInt(formData.to_location),
        item: parseInt(formData.item),
      };

      // Both ISSUE and RECEIPT entries include from_location
      if (formData.from_location) {
        submitData.from_location = parseInt(formData.from_location);
      }

      // Add tracking-specific data
      if (trackingType === 'INDIVIDUAL') {
        submitData.instances = selectedInstances;
        submitData.quantity = selectedInstances.length;
      } else if (trackingType === 'BATCH') {
        submitData.batch_allocations = batchAllocations;
        submitData.quantity = batchAllocations.reduce((sum, a) => sum + a.quantity, 0);
      } else if (trackingType === 'BULK') {
        submitData.quantity = parseInt(formData.quantity);
      }

      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null) {
          delete submitData[key];
        }
      });

      if (isEditMode) {
        await stockEntriesAPI.update(id, submitData);
        setSuccess('Stock entry updated successfully!');
        setTimeout(() => navigate('/dashboard/stock-entries'), 1500);
      } else {
        const created = await stockEntriesAPI.create(submitData);
        setSuccess('Stock entry created successfully!');
        setTimeout(() => navigate(`/dashboard/stock-entries/${created.id}`), 1500);
      }
    } catch (err) {
      console.error('Error saving stock entry:', err);
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.detail ||
                          Object.values(err.response?.data || {}).flat().join(', ') ||
                          'Failed to save stock entry';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const totalAllocated = batchAllocations.reduce((sum, a) => sum + a.quantity, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-sm font-bold text-gray-900">
            {isEditMode ? 'Edit Stock Entry' : 'New Stock Entry'}
          </h1>
          <p className="text-xs text-gray-600 mt-0">
            {formData.entry_type === 'ISSUE' ? 'Transfer items from your store to another location' : 'Receive items into your store from another location'}
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Entry Type Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            <Package className="inline h-3 w-3 mr-1" />
            Entry Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.entry_type}
            onChange={(e) => handleChange('entry_type', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            disabled={isEditMode}
          >
            <option value="ISSUE">Issue (Transfer to another location)</option>
            <option value="RECEIPT">Receipt (Receive items into store)</option>
          </select>
          {formData.entry_type === 'RECEIPT' && (
            <div className="text-xs text-blue-600 mt-1 bg-blue-50 p-1.5 rounded space-y-1">
              <p><strong>ℹ️ Receipt Entry Instructions:</strong></p>
              <ol className="list-decimal ml-4 space-y-0.5">
                <li>First, select the receiving store (your store)</li>
                <li>Then, select the source store (where items are coming from)</li>
                <li>Finally, select the item and quantity</li>
              </ol>
            </div>
          )}
          {isEditMode && (
            <p className="text-xs text-gray-500 mt-0.5">Entry type cannot be changed</p>
          )}
        </div>

        {/* From Location - Only for ISSUE entries */}
        {formData.entry_type === 'ISSUE' && (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              <MapPin className="inline h-3 w-3 mr-1" />
              From Location (Source Store) <span className="text-red-500">*</span>
            </label>
            {fromLocations.length === 1 ? (
              <>
                <input
                  type="text"
                  value={fromLocations[0]?.name + (fromLocations[0]?.is_main_store ? ' (Main Store)' : '')}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your assigned location
                </p>
              </>
            ) : (
              <>
                <select
                  value={formData.from_location}
                  onChange={(e) => handleChange('from_location', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={isEditMode}
                >
                  <option value="">Select source store</option>
                  {fromLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.is_main_store ? '(Main Store)' : ''}
                    </option>
                  ))}
                </select>
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-0.5">Source location cannot be changed</p>
                )}
              </>
            )}
          </div>
        )}

        {/* To Location - For RECEIPT entries, this is the receiving store */}
        {formData.entry_type === 'RECEIPT' && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                <MapPin className="inline h-3 w-3 mr-1" />
                Receiving Store (Your Store) <span className="text-red-500">*</span>
              </label>
              {fromLocations.length === 1 ? (
                <>
                  <input
                    type="text"
                    value={fromLocations[0]?.name + (fromLocations[0]?.is_main_store ? ' (Main Store)' : '')}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your assigned location
                  </p>
                </>
              ) : (
                <>
                  <select
                    value={formData.to_location}
                    onChange={(e) => handleChange('to_location', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    disabled={isEditMode}
                  >
                    <option value="">Select receiving store</option>
                    {fromLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} {loc.is_main_store ? '(Main Store)' : ''}
                      </option>
                    ))}
                  </select>
                  {isEditMode && (
                    <p className="text-xs text-gray-500 mt-0.5">Receiving store cannot be changed</p>
                  )}
                </>
              )}
            </div>

            {/* From Location - Source store for RECEIPT */}
            {formData.to_location && (
              <div className="bg-white rounded-lg border border-gray-200 p-2">
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  <MapPin className="inline h-3 w-3 mr-1" />
                  Source Store (Sending From) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.from_location}
                  onChange={(e) => handleChange('from_location', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={isEditMode}
                >
                  <option value="">Select source store</option>

                  {receiptSourceStores.length > 0 && (
                    <optgroup label="Internal Locations (Same Location)">
                      {receiptSourceStores.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} {loc.is_store ? (loc.is_main_store ? '(Main Store)' : '(Store)') : '(Office/Lab)'}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {receiptCanReceiveUpward && receiptUpwardStores.length > 0 && (
                    <optgroup label="Upward Locations (Other Departments)">
                      {receiptUpwardStores.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} {loc.is_store ? '(Main Store)' : '(Office/Lab)'}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {receiptSourceStores.length === 0 && !receiptCanReceiveUpward && (
                  <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-1.5 rounded">
                    ⚠️ No source locations available. This store cannot receive items via RECEIPT entry.
                  </p>
                )}
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-0.5">Source store cannot be changed</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Item Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            <Package className="inline h-3 w-3 mr-1" />
            Item <span className="text-red-500">*</span>
          </label>

          {isEditMode ? (
            // Show selected item as text when editing
            <div className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg bg-gray-100">
              {selectedItem ? `${selectedItem.name} (${selectedItem.code})` : 'No item selected'}
            </div>
          ) : (
            // Searchable dropdown for new entries
            <div ref={itemDropdownRef} className="relative">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  value={itemSearchQuery}
                  onChange={(e) => {
                    setItemSearchQuery(e.target.value);
                    setShowItemDropdown(true);
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  placeholder="Search items by name or code..."
                  className="w-full pl-7 pr-8 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={!formData.from_location}
                />
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>

              {/* Dropdown List */}
              {showItemDropdown && formData.from_location && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {getFilteredItems().length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-500 text-center">
                      No items found
                    </div>
                  ) : (
                    getFilteredItems().map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemSelect(item)}
                        className={`px-3 py-2 cursor-pointer hover:bg-primary-50 border-b border-gray-100 last:border-b-0 ${
                          formData.item === item.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-600">
                              Code: {item.code} • Category: {item.category_name}
                            </p>
                          </div>
                          {formData.item === item.id && (
                            <span className="ml-2 text-primary-600">✓</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {selectedItem && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Category:</strong> {selectedItem.category_name}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                <strong>Tracking:</strong> {
                  trackingType === 'INDIVIDUAL' ? 'Fixed Asset (Individual)' :
                  trackingType === 'BATCH' ? 'Perishable (FIFO Batch)' :
                  trackingType === 'BULK' ? 'Consumable (Bulk)' : '-'
                }
              </p>
            </div>
          )}
          {isEditMode && (
            <p className="text-xs text-gray-500 mt-0.5">Item cannot be changed</p>
          )}
        </div>

        {/* Instance Selection for INDIVIDUAL tracking */}
        {trackingType === 'INDIVIDUAL' && (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="mb-2 p-1.5 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-800">
                <strong>Available at this store:</strong> {availableInstances.length} instance(s)
              </p>
            </div>

            {/* Quantity Input for Auto-Selection */}
            <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                Quick Select by Quantity
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={availableInstances.length}
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-700">
                    Enter quantity to auto-select first <strong>{formData.quantity || 0}</strong> instance(s)
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Or manually select specific instances below
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-900">
                Manual Selection ({selectedInstances.length} selected)
              </h3>

              {availableInstances.length > 0 && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInstances(availableInstances.map(i => i.id));
                      setFormData(prev => ({ ...prev, quantity: availableInstances.length }));
                    }}
                    className="px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInstances([]);
                      setFormData(prev => ({ ...prev, quantity: 0 }));
                    }}
                    className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {selectedInstances.length === 0 && availableInstances.length > 0 && (
              <div className="mb-2 p-2 bg-amber-50 border border-amber-300 rounded-lg">
                <p className="text-xs text-amber-800 font-medium">
                  ⚠️ Please select instances by entering quantity above OR by manually checking boxes below
                </p>
              </div>
            )}

            {availableInstances.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Package className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                <p className="text-xs">No available instances at this store</p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {availableInstances.map(instance => (
                  <label
                    key={instance.id}
                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${
                      selectedInstances.includes(instance.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInstances.includes(instance.id)}
                      onChange={() => handleInstanceToggle(instance.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">{instance.instance_code}</p>
                      <p className="text-xs text-gray-600">
                        Status: {instance.status} | QR: {instance.qr_code || 'N/A'}
                      </p>
                    </div>
                    {selectedInstances.includes(instance.id) && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary-600 text-white rounded-full">
                        Selected
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Batch Selection for BATCH tracking (FIFO) */}
        {trackingType === 'BATCH' && (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="mb-2 p-1.5 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-800">
                <strong>Available at this store:</strong> {availableBatches.reduce((sum, b) => sum + (b.location_available_quantity || 0), 0)} units in {availableBatches.length} batch(es)
              </p>
            </div>
            <h3 className="text-xs font-semibold text-gray-900 mb-2">
              Allocate Quantity from Batches (FIFO - Oldest First)
            </h3>

            <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Total Allocated:</strong> {totalAllocated} units
              </p>
            </div>

            {availableBatches.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Package className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                <p className="text-xs">No available batches at this store</p>
              </div>
            ) : (
              <div className="space-y-1">
                {availableBatches.map(batch => {
                  const allocation = batchAllocations.find(a => a.batch_id === batch.id);
                  const isExpiringSoon = batch.days_until_expiry <= 30;
                  const availableQty = batch.location_available_quantity || 0;
                  const currentQty = batch.location_current_quantity || 0;
                  const reservedQty = batch.location_reserved_quantity || 0;

                  return (
                    <div
                      key={batch.id}
                      className={`p-2 border rounded-lg ${
                        isExpiringSoon ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900">
                            Batch: {batch.batch_number}
                          </p>
                          <p className="text-xs text-gray-600">
                            <strong className="text-green-700">Available: {availableQty}</strong> {selectedItem?.unit || 'units'}
                            {reservedQty > 0 && <span className="text-orange-600"> (Reserved: {reservedQty})</span>} |
                            Expires: {new Date(batch.expiry_date).toLocaleDateString()} |
                            <span className={isExpiringSoon ? 'text-yellow-700 font-medium' : ''}>
                              {batch.days_until_expiry} days left
                            </span>
                          </p>
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            min="0"
                            max={availableQty}
                            value={allocation?.quantity || 0}
                            onChange={(e) => handleBatchAllocation(batch.id, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Qty"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quantity for BULK tracking */}
        {trackingType === 'BULK' && (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={totalAvailable}
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <div className="mt-1 p-1.5 bg-blue-50 border border-blue-200 rounded">
              {sourceLocationIsStore ? (
                <>
                  <p className="text-xs text-blue-800">
                    <strong>Available to issue:</strong> {totalAvailable} units
                  </p>
                  {reservedQuantity > 0 && (
                    <div className="text-xs text-blue-700 mt-1 pt-1 border-t border-blue-300">
                      <p>Total at store: {totalQuantity} units</p>
                      <p>Reserved: {reservedQuantity} units</p>
                      <p className="font-semibold">Free to issue: {totalAvailable} units</p>
                    </div>
                  )}
                  {reservedQuantity === 0 && totalQuantity > 0 && (
                    <p className="text-xs text-blue-700 mt-0.5">
                      Consumable item (tracked in bulk quantity)
                    </p>
                  )}
                </>
              ) : (
                <div className="text-xs text-green-800">
                  <p className="text-xs font-semibold">📍 Non-Store Location</p>
                  <p className="text-xs mt-0.5"><strong>In Use:</strong> {inUseQuantity} units</p>
                  <p className="text-xs"><strong>Available:</strong> {totalAvailable} units</p>
                  {totalQuantity > inUseQuantity && <p className="text-xs text-green-700 mt-0.5">(Items issued to lab/room/office)</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Temporary Issue Checkbox - Only for ISSUE entry type */}
        {formData.entry_type === 'ISSUE' && formData.item && (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_temporary}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    is_temporary: e.target.checked,
                    expected_return_date: e.target.checked ? prev.expected_return_date : '',
                    temporary_recipient: e.target.checked ? prev.temporary_recipient : ''
                  }));
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-xs font-medium text-gray-900">Temporary Issue</span>
                <p className="text-xs text-gray-600">Item(s) will be returned after temporary use</p>
              </div>
            </label>
          </div>
        )}

        {/* Temporary Issue Details */}
        {formData.is_temporary && formData.entry_type === 'ISSUE' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-yellow-700" />
              <h3 className="text-xs font-semibold text-yellow-900">Temporary Issue Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Expected Return Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expected_return_date}
                  onChange={(e) => handleChange('expected_return_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.temporary_recipient}
                  onChange={(e) => handleChange('temporary_recipient', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Person responsible"
                  required
                />
              </div>
            </div>

            <div className="mt-2 p-2 bg-yellow-100 rounded">
              <p className="text-xs text-yellow-800">
                <AlertCircle className="inline h-3 w-3 mr-1" />
                This item will need to be returned by the recipient on or before the expected return date.
              </p>
            </div>
          </div>
        )}

        {/* To Location */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            <ArrowRight className="inline h-3 w-3 mr-1" />
            To Location <span className="text-red-500">*</span>
          </label>
          
          <div className="space-y-2">
            {/* Internal Locations */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-0.5 block">
                Internal Locations (Within Department)
              </label>
              <select
                value={formData.to_location}
                onChange={(e) => handleChange('to_location', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!formData.from_location}
              >
                <option value="">Select internal location</option>
                {internalTargets.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.is_store ? '(Store)' : '(Office/Lab)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Standalone Locations (Main Store Only) */}
            {standaloneTargets.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-0.5 block">
                  Other Departments (Main Store Only)
                </label>
                <select
                  value={formData.to_location}
                  onChange={(e) => handleChange('to_location', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={!formData.from_location}
                >
                  <option value="">Select department</option>
                  {standaloneTargets.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Upward Transfer */}
            {canIssueUpward && upwardTarget && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-0.5 block">
                  <ArrowUp className="inline h-3 w-3" /> Upward Transfer (Return to Parent)
                </label>
                <button
                  type="button"
                  onClick={() => handleChange('to_location', upwardTarget.id)}
                  className={`w-full px-2 py-1 text-xs border rounded-lg text-left transition-colors ${
                    formData.to_location === upwardTarget.id
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {upwardTarget.name} (Parent Location)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Purpose & Remarks */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Purpose
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => handleChange('purpose', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Reason for transfer"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Additional notes"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/stock-entries')}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-3 w-3" />
            {saving ? 'Saving...' : isEditMode ? 'Update Entry' : 'Create Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StockEntryForm;