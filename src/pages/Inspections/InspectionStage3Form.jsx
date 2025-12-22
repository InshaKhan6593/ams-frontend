// src/pages/Inspections/InspectionStage3Form.jsx
import { useState, useEffect } from 'react';
import { Link2, Plus, Search, Eye, Check, X, AlertCircle, Package, FolderPlus, ChevronDown, ChevronUp, Unlink, Edit2, Save } from 'lucide-react';
import { inspectionsAPI } from '../../api/inspections';
import { itemsAPI, categoriesAPI } from '../../api/items';
import { locationsAPI } from '../../api/locations';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ACCOUNTING_UNITS, UNIT_GROUPS } from '../../constants/units';

const InspectionStage3Form = ({ inspection, isReadOnly, onSave, saving, onRefresh }) => {
  const [unlinkedItems, setUnlinkedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateSubCategoryModal, setShowCreateSubCategoryModal] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkingSummary, setLinkingSummary] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [centralStoreDetails, setCentralStoreDetails] = useState({});
  const [editingLinkedItemId, setEditingLinkedItemId] = useState(null);
  const [editedCentralDetails, setEditedCentralDetails] = useState({});
  const [batchTrackingDetails, setBatchTrackingDetails] = useState({});
  const [individualTrackingDetails, setIndividualTrackingDetails] = useState({});
  const [bulkTrackingDetails, setBulkTrackingDetails] = useState({});

  const canEdit = !isReadOnly;

  useEffect(() => {
    if (inspection?.id && inspection?.stage === 'CENTRAL_REGISTER') {
      fetchUnlinkedItems();
    }
  }, [inspection?.id, inspection?.stage]);

  const fetchUnlinkedItems = async () => {
    try {
      setLoading(true);
      const data = await inspectionsAPI.getUnlinkedItems(inspection.id);
      setUnlinkedItems(data.unlinked_items || []);
      setLinkingSummary(data.linking_summary || null);
      setError('');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('Cannot fetch unlinked items - permission denied or wrong stage');
        setUnlinkedItems([]);
      } else if (inspection?.stage === 'CENTRAL_REGISTER') {
        setError('Failed to load unlinked items');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchItems = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const data = await itemsAPI.getAll({ search: query });
      const results = Array.isArray(data) ? data : data.results || [];
      setSearchResults(results.slice(0, 10)); // Limit to top 10 results
    } catch (err) {
      console.error('Error searching items:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchItems(query);
  };

  const handleSelectItemForLinking = async (item) => {
    // If tracking_type is not present, fetch full item details
    if (!item.tracking_type) {
      try {
        const fullItem = await itemsAPI.get(item.id);
        setSelectedItem(fullItem);

        // Reset tracking details for types that don't match
        if (fullItem.tracking_type !== 'BATCH') {
          setBatchTrackingDetails({});
        }
        if (fullItem.tracking_type !== 'INDIVIDUAL') {
          setIndividualTrackingDetails({});
        }
        if (fullItem.tracking_type !== 'BULK') {
          setBulkTrackingDetails({});
        }
      } catch (err) {
        console.error('Error fetching item details:', err);
        setSelectedItem(item); // Fall back to using the search result
      }
    } else {
      setSelectedItem(item);

      // Reset tracking details for types that don't match
      if (item.tracking_type !== 'BATCH') {
        setBatchTrackingDetails({});
      }
      if (item.tracking_type !== 'INDIVIDUAL') {
        setIndividualTrackingDetails({});
      }
      if (item.tracking_type !== 'BULK') {
        setBulkTrackingDetails({});
      }
    }

    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLinkToExisting = async (inspectionItemId, systemItemId) => {
    try {
      setLoading(true);

      const payload = {
        inspection_item_id: inspectionItemId,
        item_id: systemItemId,
      };

      // Central store details will be added later via Edit button after linking

      // Include batch tracking details if provided (for BATCH items)
      const batchDetails = batchTrackingDetails[inspectionItemId] || {};
      if (batchDetails.batch_number) {
        payload.batch_number = batchDetails.batch_number;
      }
      if (batchDetails.expiry_date) {
        payload.expiry_date = batchDetails.expiry_date;
      }
      if (batchDetails.manufacture_date) {
        payload.manufacture_date = batchDetails.manufacture_date;
      }

      // Include individual tracking details if provided (for INDIVIDUAL items)
      const individualDetails = individualTrackingDetails[inspectionItemId] || {};
      if (individualDetails.warranty_months) {
        payload.warranty_months = individualDetails.warranty_months;
      }

      // Include bulk tracking details if provided (for BULK items)
      const bulkDetails = bulkTrackingDetails[inspectionItemId] || {};
      if (bulkDetails.minimum_stock_level) {
        payload.minimum_stock_level = bulkDetails.minimum_stock_level;
      }
      if (bulkDetails.reorder_level) {
        payload.reorder_level = bulkDetails.reorder_level;
      }

      const response = await inspectionsAPI.linkToExistingItem(inspection.id, payload);

      setSuccess('Item linked successfully! You can now add Central Register details via the Edit button.');
      setSelectedItem(null);
      setExpandedItemId(null);
      setBatchTrackingDetails({});
      setIndividualTrackingDetails({});
      setBulkTrackingDetails({});

      // Update linking summary and unlinked items
      if (response.linking_summary) {
        setLinkingSummary(response.linking_summary);
      }

      await fetchUnlinkedItems();

      if (onRefresh) {
        await onRefresh();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to link item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndLink = async (itemData) => {
    try {
      setLoading(true);

      const payload = {
        inspection_item_id: selectedItem.id,
        item_data: itemData,
      };

      // Central store details will be added later via Edit button after linking

      // Include batch tracking details from modal form data (for BATCH items)
      if (itemData.batch_number) {
        payload.batch_number = itemData.batch_number;
      }
      if (itemData.expiry_date) {
        payload.expiry_date = itemData.expiry_date;
      }
      if (itemData.manufacture_date) {
        payload.manufacture_date = itemData.manufacture_date;
      }

      // Include individual tracking details from modal form data (for INDIVIDUAL items)
      if (itemData.warranty_months) {
        payload.warranty_months = itemData.warranty_months;
      }

      // Include bulk tracking details from modal form data (for BULK items)
      if (itemData.minimum_stock_level) {
        payload.minimum_stock_level = itemData.minimum_stock_level;
      }
      if (itemData.reorder_level) {
        payload.reorder_level = itemData.reorder_level;
      }

      const response = await inspectionsAPI.createAndLinkItem(inspection.id, payload);

      setSuccess('New item created and linked successfully! You can now add Central Register details via the Edit button.');
      setShowCreateModal(false);
      setSelectedItem(null);
      setExpandedItemId(null);
      setBatchTrackingDetails({});
      setIndividualTrackingDetails({});
      setBulkTrackingDetails({});

      // Update linking summary
      if (response.linking_summary) {
        setLinkingSummary(response.linking_summary);
      }

      await fetchUnlinkedItems();

      if (onRefresh) {
        await onRefresh();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to create item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubCategory = async (subCategoryData) => {
    try {
      setLoading(true);
      const response = await inspectionsAPI.createSubCategory(inspection.id, subCategoryData);
      setSuccess(`Sub-category "${response.name}" created successfully!`);
      setShowCreateSubCategoryModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to create sub-category');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewItemDetails = async (systemItemId) => {
    try {
      const item = await itemsAPI.get(systemItemId);
      setShowItemDetails(item);
    } catch (err) {
      setError('Failed to load item details');
      console.error(err);
    }
  };

  const handleUnlinkItem = async (inspectionItemId) => {
    if (!window.confirm('Are you sure you want to unlink this item? You will need to link it again.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await inspectionsAPI.unlinkItem(inspection.id, {
        inspection_item_id: inspectionItemId,
      });

      setSuccess('Item unlinked successfully!');

      // Update linking summary
      if (response.linking_summary) {
        setLinkingSummary(response.linking_summary);
      }

      await fetchUnlinkedItems();

      if (onRefresh) {
        await onRefresh();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to unlink item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditCentralDetails = (item) => {
    setEditingLinkedItemId(item.id);
    setEditedCentralDetails({
      central_register_no: item.central_register_no || '',
      central_register_page_no: item.central_register_page_no || '',
    });
  };

  const handleCancelEditCentralDetails = () => {
    setEditingLinkedItemId(null);
    setEditedCentralDetails({});
  };

  const handleSaveCentralDetails = async (inspectionItemId) => {
    try {
      setLoading(true);
      const response = await inspectionsAPI.updateCentralRegisterDetails(inspection.id, {
        inspection_item_id: inspectionItemId,
        central_register_no: editedCentralDetails.central_register_no,
        central_register_page_no: editedCentralDetails.central_register_page_no,
      });

      setSuccess('Central register details updated successfully!');
      setEditingLinkedItemId(null);
      setEditedCentralDetails({});

      await fetchUnlinkedItems();

      if (onRefresh) {
        await onRefresh();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to update details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemExpansion = (itemId) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
    setSelectedItem(null);
    setSearchQuery('');
    setSearchResults([]);
    // Reset tracking details when collapsing
    if (expandedItemId === itemId) {
      setBatchTrackingDetails({});
      setIndividualTrackingDetails({});
      setBulkTrackingDetails({});
    }
  };

  if (loading && !selectedItem) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-2">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
        <h3 className="text-xs font-semibold text-blue-900 mb-1">Stage 3: Central Register Details & Item Linking</h3>
        <p className="text-xs text-blue-700">
          Link each inspection item to an existing system item or create a new one. Search manually for items or create new items with sub-categories.
        </p>
      </div>

      {/* Linking Progress Summary */}
      {linkingSummary && (
        <div className="bg-white border border-gray-200 rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-semibold text-gray-900">Linking Progress</h4>
            <span className={`text-xs font-medium ${linkingSummary.all_linked ? 'text-green-600' : 'text-amber-600'}`}>
              {linkingSummary.linked_count} / {linkingSummary.total_items} Linked
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${linkingSummary.all_linked ? 'bg-green-600' : 'bg-amber-500'}`}
              style={{ width: `${(linkingSummary.linked_count / linkingSummary.total_items) * 100}%` }}
            />
          </div>
          {linkingSummary.all_linked && (
            <p className="text-xs text-green-600 mt-1">✓ All items linked! You can now submit to audit review.</p>
          )}
          {!linkingSummary.all_linked && (
            <p className="text-xs text-amber-600 mt-1">⚠ {linkingSummary.unlinked_count} item(s) remaining to link.</p>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-1.5">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-red-800">Error</p>
            <p className="text-xs text-red-700">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-start gap-1.5">
          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-green-800">Success</p>
            <p className="text-xs text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Linked Items - Display with Edit/Unlink Options */}
      {inspection.inspection_items && inspection.inspection_items.filter(i => i.is_item_linked).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-2">
          <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
            <Check className="w-4 h-4 text-green-600" />
            Linked Items ({inspection.inspection_items.filter(i => i.is_item_linked).length})
          </h4>
          <div className="space-y-1">
            {inspection.inspection_items.filter(i => i.is_item_linked).map((item) => (
              <div key={item.id} className="bg-green-50 border border-green-200 rounded-lg p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900">
                      {item.item_description || item.description || 'Unnamed Item'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      → Linked to: <span className="font-medium text-green-700">{item.item_name}</span>
                      {item.item_code && <span className="text-gray-500 ml-1">({item.item_code})</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Qty: {item.accepted_quantity} {item.unit} •
                      Linked by: {item.linked_by_name} •
                      {item.linked_at && new Date(item.linked_at).toLocaleString()}
                    </p>

                    {/* Editable Central Register Details */}
                    {editingLinkedItemId === item.id ? (
                      <div className="mt-2 p-2 bg-white border border-purple-300 rounded space-y-2">
                        <p className="text-xs font-semibold text-purple-900">Edit Central Register Details</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Register No.
                            </label>
                            <input
                              type="text"
                              value={editedCentralDetails.central_register_no || ''}
                              onChange={(e) => setEditedCentralDetails(prev => ({
                                ...prev,
                                central_register_no: e.target.value
                              }))}
                              placeholder="e.g., CR-2024-001"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Page No.
                            </label>
                            <input
                              type="text"
                              value={editedCentralDetails.central_register_page_no || ''}
                              onChange={(e) => setEditedCentralDetails(prev => ({
                                ...prev,
                                central_register_page_no: e.target.value
                              }))}
                              placeholder="e.g., 42"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveCentralDetails(item.id)}
                            disabled={loading}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditCentralDetails}
                            disabled={loading}
                            className="px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {(item.central_register_no || item.central_register_page_no) && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Central Register: {item.central_register_no || 'N/A'} • Page: {item.central_register_page_no || 'N/A'}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {canEdit && editingLinkedItemId !== item.id && (
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleStartEditCentralDetails(item)}
                        disabled={loading}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                        title="Edit central register details"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleUnlinkItem(item.id)}
                        disabled={loading}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                        title="Unlink this item"
                      >
                        <Unlink className="w-3 h-3" />
                        Unlink
                      </button>
                    </div>
                  )}

                  {!canEdit && (
                    <span className="inline-flex px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex-shrink-0">
                      Linked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unlinked Items - Interactive Linking */}
      {unlinkedItems.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Items Requiring Linking ({unlinkedItems.length})
            </h4>
            <button
              onClick={() => setShowCreateSubCategoryModal(true)}
              disabled={!canEdit}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <FolderPlus className="w-3 h-3" />
              Create Sub-Category
            </button>
          </div>

          <div className="space-y-1">
            {unlinkedItems.map((item) => (
              <div key={item.id} className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900">
                      {item.item_description || item.description || 'Unnamed Item'}
                    </p>
                    {(item.item_specifications || item.specifications) && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        Specs: {item.item_specifications || item.specifications}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      Qty: {item.accepted_quantity} {item.unit}
                      {item.unit_price && ` • Rate: Rs. ${item.unit_price}`}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleItemExpansion(item.id)}
                    disabled={!canEdit}
                    className="ml-2 p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors disabled:opacity-50"
                  >
                    {expandedItemId === item.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Expanded Linking Interface */}
                {expandedItemId === item.id && canEdit && (
                  <div className="mt-2 pt-2 border-t border-amber-300 space-y-2">
                    {/* Show full item details when expanded */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Item to Link:</p>
                      <p className="text-xs text-blue-800">
                        <strong>Description:</strong> {item.item_description || item.description}
                      </p>
                      {(item.item_specifications || item.specifications) && (
                        <p className="text-xs text-blue-800 mt-1">
                          <strong>Specs:</strong> {item.item_specifications || item.specifications}
                        </p>
                      )}
                    </div>

                    {/* Central Store Details - Removed: Users can edit these after linking via the Edit button */}

                    {/* Batch Tracking Details (only for BATCH items - perishables) */}
                    {selectedItem?.tracking_type === 'BATCH' && (
                      <div className="bg-amber-50 border border-amber-300 rounded p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-amber-700" />
                          <p className="text-xs font-semibold text-amber-900">Batch Tracking Details (Required)</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Batch Number
                            </label>
                            <input
                              type="text"
                              value={batchTrackingDetails[item.id]?.batch_number || ''}
                              onChange={(e) => setBatchTrackingDetails(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  batch_number: e.target.value
                                }
                              }))}
                              placeholder="Auto-generated if empty"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Manufacture Date
                            </label>
                            <input
                              type="date"
                              value={batchTrackingDetails[item.id]?.manufacture_date || ''}
                              onChange={(e) => setBatchTrackingDetails(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  manufacture_date: e.target.value
                                }
                              }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Expiry Date <span className="text-red-600" title="Required for perishables">*</span>
                            </label>
                            <input
                              type="date"
                              value={batchTrackingDetails[item.id]?.expiry_date || ''}
                              onChange={(e) => setBatchTrackingDetails(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  expiry_date: e.target.value
                                }
                              }))}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                        <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-800 border border-amber-300">
                          <span className="font-semibold">📦 Batch Item Detected:</span> This item uses <strong>BATCH tracking</strong> (perishable).
                          Expiry date is <strong className="text-red-700">mandatory</strong> for batch items.
                        </div>
                      </div>
                    )}

                    {/* Individual Tracking Details (only for INDIVIDUAL items - fixed assets) */}
                    {selectedItem?.tracking_type === 'INDIVIDUAL' && (
                      <div className="bg-blue-50 border border-blue-300 rounded p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-blue-700" />
                          <p className="text-xs font-semibold text-blue-900">Fixed Asset Details (Optional)</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Warranty (Months)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={individualTrackingDetails[item.id]?.warranty_months || ''}
                              onChange={(e) => setIndividualTrackingDetails(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  warranty_months: e.target.value
                                }
                              }))}
                              placeholder="e.g., 12"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800 border border-blue-300">
                          <span className="font-semibold">🔖 Fixed Asset Detected:</span> This item uses <strong>INDIVIDUAL tracking</strong>.
                          QR codes will be auto-generated for each asset instance. Serial numbers and asset tags can be added later from the Inventory page.
                        </div>
                      </div>
                    )}

                    {/* Bulk Tracking Details (only for BULK items - consumables) */}
                    {selectedItem?.tracking_type === 'BULK' && (
                      <div className="bg-green-50 border border-green-300 rounded p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-green-700" />
                          <p className="text-xs font-semibold text-green-900">Consumable Stock Details (Optional)</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Minimum Stock Level
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={bulkTrackingDetails[item.id]?.minimum_stock_level || ''}
                              onChange={(e) => setBulkTrackingDetails(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  minimum_stock_level: e.target.value
                                }
                              }))}
                              placeholder="Minimum quantity threshold"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Reorder Level
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={bulkTrackingDetails[item.id]?.reorder_level || ''}
                              onChange={(e) => setBulkTrackingDetails(prev => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  reorder_level: e.target.value
                                }
                              }))}
                              placeholder="When to reorder"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>
                        <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-800 border border-green-300">
                          <span className="font-semibold">📊 Bulk Item Detected:</span> This item uses <strong>BULK tracking</strong> (consumable).
                          Quantity tracked in aggregate without individual units.
                        </div>
                      </div>
                    )}

                    {/* Search for Existing Items */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Option 1: Search for Existing Item
                      </label>

                      {/* Show selected item info */}
                      {selectedItem && (
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-300 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-blue-900">{selectedItem.name}</p>
                              <p className="text-xs text-blue-700">
                                Code: {selectedItem.code} • Tracking: {selectedItem.tracking_type}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedItem(null);
                                setSearchQuery('');
                              }}
                              className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Clear selection"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          {/* Show link button for items that need additional data */}
                          {(selectedItem.tracking_type === 'BATCH' ||
                            selectedItem.tracking_type === 'INDIVIDUAL' ||
                            selectedItem.tracking_type === 'BULK') && (
                            <div className="mt-2">
                              <button
                                onClick={() => handleLinkToExisting(item.id, selectedItem.id)}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                <Link2 className="w-3 h-3" />
                                {loading ? 'Linking...' :
                                  selectedItem.tracking_type === 'BATCH' ? 'Link Item (Fill Batch Details Above)' :
                                  selectedItem.tracking_type === 'INDIVIDUAL' ? 'Link Item (Fill Asset Details Above If Available)' :
                                  'Link Item (Fill Stock Details Above If Needed)'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          placeholder="Search by item name or code..."
                          className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      {/* Search Results */}
                      {searching && (
                        <div className="mt-1 p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-500">
                          Searching...
                        </div>
                      )}

                      {searchQuery && searchResults.length > 0 && (
                        <div className="mt-1 bg-white border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                          {searchResults.map((result) => (
                            <div
                              key={result.id}
                              className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                // Set selectedItem to show tracking-specific fields
                                handleSelectItemForLinking(result);
                                // Note: User will click "Link Item" button after filling fields
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-gray-900">{result.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Code: {result.code} • Category: {result.category_name}
                                    {result.tracking_type && (
                                      <span className="ml-1">
                                        • <span className={`font-medium ${
                                          result.tracking_type === 'BATCH' ? 'text-amber-600' :
                                          result.tracking_type === 'INDIVIDUAL' ? 'text-blue-600' :
                                          'text-green-600'
                                        }`}>{result.tracking_type}</span>
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <button className="ml-2 p-1 text-blue-600 hover:bg-blue-50 rounded">
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchQuery && !searching && searchResults.length === 0 && (
                        <div className="mt-1 p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-500">
                          No items found. Try a different search or create a new item below.
                        </div>
                      )}
                    </div>

                    {/* Create New Item */}
                    <div className="pt-2 border-t border-amber-200">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Option 2: Create New Item
                      </label>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowCreateModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Create New Item & Link
                      </button>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        If no existing item matches, create a new one
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <Check className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-xs font-medium text-green-800">All Items Linked!</p>
            <p className="text-xs text-green-700 mt-0.5">
              You can now proceed to submit to audit review.
            </p>
          </div>
        )
      )}

      {/* Create Item Modal */}
      {showCreateModal && selectedItem && (
        <CreateItemModal
          inspectionItem={selectedItem}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedItem(null);
          }}
          onCreate={handleCreateAndLink}
          loading={loading}
        />
      )}

      {/* Create Sub-Category Modal */}
      {showCreateSubCategoryModal && (
        <CreateSubCategoryModal
          onClose={() => setShowCreateSubCategoryModal(false)}
          onCreate={handleCreateSubCategory}
          loading={loading}
          contextMessage={unlinkedItems.length > 0 ? `Creating sub-category for linking inspection items. ${unlinkedItems.length} item(s) need linking.` : null}
        />
      )}

      {/* Item Details Modal */}
      {showItemDetails && (
        <ItemDetailsModal
          item={showItemDetails}
          onClose={() => setShowItemDetails(null)}
        />
      )}
    </div>
  );
};

// Create Item Modal Component
const CreateItemModal = ({ inspectionItem, onClose, onCreate, loading }) => {
  const [formData, setFormData] = useState({
    name: inspectionItem.item_description || inspectionItem.description || '',
    category: '',
    description: inspectionItem.item_specifications || inspectionItem.specifications || '',
    acct_unit: inspectionItem.unit || '',
    specifications: inspectionItem.item_specifications || inspectionItem.specifications || '',
    default_location: '',
    // Central Register Details
    central_register_no: '',
    central_register_page_no: '',
    // Tracking-specific fields
    batch_number: '',
    manufacture_date: '',
    expiry_date: '',
    warranty_months: '',
    minimum_stock_level: '',
    reorder_level: '',
  });
  const [allCategories, setAllCategories] = useState([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedCategoryTrackingType, setSelectedCategoryTrackingType] = useState(null);

  useEffect(() => {
    fetchAllCategories();
    fetchLocations();
  }, []);

  const fetchAllCategories = async () => {
    try {
      setLoadingData(true);
      const data = await categoriesAPI.getAll();
      // Handle both array and paginated responses
      const categories = Array.isArray(data) ? data : data.results || [];
      const activeCategories = categories.filter(cat => cat.is_active);

      setAllCategories(activeCategories);

      // Build hierarchical structure
      const broader = activeCategories.filter(cat => !cat.parent_category);
      const hierarchical = [];

      broader.forEach(broaderCat => {
        // Add broader category
        hierarchical.push({
          ...broaderCat,
          level: 0,
          displayName: `${broaderCat.name} (${broaderCat.tracking_type})`
        });

        // Add its sub-categories
        const subs = activeCategories.filter(cat => cat.parent_category === broaderCat.id);
        subs.forEach(subCat => {
          hierarchical.push({
            ...subCat,
            level: 1,
            displayName: `  ↳ ${subCat.name} (${subCat.tracking_type || broaderCat.tracking_type})`
          });
        });
      });

      setHierarchicalCategories(hierarchical);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await locationsAPI.getLocations();
      setLocations(data.filter(loc => loc.is_standalone && loc.is_active));
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Track selected category's tracking type
    if (name === 'category' && value) {
      const selectedCategory = allCategories.find(cat => cat.id === parseInt(value));
      if (selectedCategory) {
        // For sub-categories, use inherited tracking type; for broader, use direct field
        const trackingType = selectedCategory.tracking_type || selectedCategory.inherited_tracking_type;
        setSelectedCategoryTrackingType(trackingType);
      } else {
        setSelectedCategoryTrackingType(null);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clean up form data - remove empty strings and convert them to null for optional fields
    const cleanedData = { ...formData };

    // Remove tracking-specific numeric fields if they're empty (not relevant to this tracking type)
    const numericFields = ['warranty_months', 'minimum_stock_level', 'reorder_level'];
    numericFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === null || cleanedData[field] === undefined) {
        delete cleanedData[field];
      }
    });

    // Remove empty string fields for dates and other optional text fields
    const optionalFields = [
      'batch_number', 'manufacture_date', 'expiry_date',
      'description', 'specifications', 'central_register_no', 'central_register_page_no'
    ];
    optionalFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === null || cleanedData[field] === undefined) {
        delete cleanedData[field];
      }
    });

    onCreate(cleanedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Create New Item</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-3">
            <h4 className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1">
              <Package className="w-4 h-4" />
              Inspection Item Details
            </h4>
            <div className="space-y-1.5">
              <div>
                <span className="text-xs font-semibold text-blue-800">Description:</span>
                <p className="text-xs text-blue-900 mt-0.5 font-medium">
                  {inspectionItem.item_description || inspectionItem.description || 'N/A'}
                </p>
              </div>
              {(inspectionItem.item_specifications || inspectionItem.specifications) && (
                <div>
                  <span className="text-xs font-semibold text-blue-800">Specifications:</span>
                  <p className="text-xs text-blue-900 mt-0.5">
                    {inspectionItem.item_specifications || inspectionItem.specifications}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-blue-200">
                <div>
                  <span className="text-xs font-semibold text-blue-800">Quantity:</span>
                  <span className="text-xs text-blue-900 ml-1 font-medium">
                    {inspectionItem.accepted_quantity} {inspectionItem.unit}
                  </span>
                </div>
                {inspectionItem.unit_price && (
                  <div>
                    <span className="text-xs font-semibold text-blue-800">Rate:</span>
                    <span className="text-xs text-blue-900 ml-1 font-medium">
                      Rs. {inspectionItem.unit_price}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-300 rounded-lg p-2">
            <p className="text-xs text-amber-800">
              <strong>💡 Tip:</strong> Create an item that matches the description above. Select the appropriate sub-category based on the item type.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <h2 className="text-xs font-semibold text-gray-900 mb-2">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-48 overflow-y-auto"
                style={{ maxHeight: '12rem' }}
                required
                disabled={loadingData}
                size="1"
              >
                <option value="">Select category</option>
                {hierarchicalCategories.map(cat => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    className={cat.level === 0 ? 'font-semibold bg-gray-50' : 'font-normal'}
                    style={{
                      paddingLeft: cat.level === 0 ? '0.5rem' : '1.5rem',
                      fontWeight: cat.level === 0 ? '600' : '400'
                    }}
                  >
                    {cat.displayName}
                  </option>
                ))}
              </select>
              {hierarchicalCategories.length === 0 && !loadingData && (
                <p className="text-xs text-amber-600 mt-1">
                  No categories available. Create categories first.
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                💡 Choose broader category or specific sub-category. Indented options (↳) are sub-categories.
              </p>
              {selectedCategoryTrackingType === 'BATCH' && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded">
                  <p className="text-xs text-amber-800">
                    <strong>📦 Batch Tracking Detected:</strong> This category uses BATCH tracking (perishable items).
                    Batch details will be required during linking.
                  </p>
                </div>
              )}
              {selectedCategoryTrackingType === 'INDIVIDUAL' && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-300 rounded">
                  <p className="text-xs text-blue-800">
                    <strong>🔖 Individual Tracking:</strong> This category uses INDIVIDUAL tracking (fixed assets with QR codes).
                  </p>
                </div>
              )}
              {selectedCategoryTrackingType === 'BULK' && (
                <div className="mt-2 p-2 bg-green-50 border border-green-300 rounded">
                  <p className="text-xs text-green-800">
                    <strong>📊 Bulk Tracking:</strong> This category uses BULK tracking (consumables).
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Accounting Unit <span className="text-red-500">*</span>
              </label>
              <select
                name="acct_unit"
                value={formData.acct_unit}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select unit</option>
                {Object.entries(UNIT_GROUPS).map(([groupName, unitValues]) => (
                  <optgroup key={groupName} label={groupName}>
                    {unitValues.map(unitValue => {
                      const unit = ACCOUNTING_UNITS.find(u => u.value === unitValue);
                      return unit ? (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ) : null;
                    })}
                  </optgroup>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-0.5">
                Select the measurement unit for this item
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Default Location <span className="text-red-500">*</span>
              </label>
              <select
                name="default_location"
                value={formData.default_location}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select location</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Specifications
              </label>
              <textarea
                name="specifications"
                value={formData.specifications}
                onChange={handleChange}
                rows="2"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Central Register Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">Central Store Register Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Central Register No.
              </label>
              <input
                type="text"
                name="central_register_no"
                value={formData.central_register_no}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., CR-2024-001"
              />
              <p className="text-xs text-gray-500 mt-0.5">
                Optional: Central store register number
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Page No.
              </label>
              <input
                type="text"
                name="central_register_page_no"
                value={formData.central_register_page_no}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 45"
              />
              <p className="text-xs text-gray-500 mt-0.5">
                Optional: Register page number
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">Tracking-Specific Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

            {/* BATCH Tracking Fields */}
            {selectedCategoryTrackingType === 'BATCH' && (
              <>
                <div className="md:col-span-2">
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-amber-900 mb-2">📦 Batch Tracking Details</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Batch Number
                        </label>
                        <input
                          type="text"
                          name="batch_number"
                          value={formData.batch_number}
                          onChange={handleChange}
                          placeholder="Auto-generated if empty"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Manufacture Date
                        </label>
                        <input
                          type="date"
                          name="manufacture_date"
                          value={formData.manufacture_date}
                          onChange={handleChange}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Expiry Date <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="date"
                          name="expiry_date"
                          value={formData.expiry_date}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* INDIVIDUAL Tracking Fields */}
            {selectedCategoryTrackingType === 'INDIVIDUAL' && (
              <>
                <div className="md:col-span-2">
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-blue-900 mb-2">🔖 Fixed Asset Details (Optional)</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Warranty (Months)
                        </label>
                        <input
                          type="number"
                          name="warranty_months"
                          value={formData.warranty_months}
                          onChange={handleChange}
                          min="0"
                          placeholder="e.g., 12"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800 border border-blue-300">
                      <span className="font-semibold">📝 Note:</span> Serial numbers and asset tags can be added later from the Inventory page when physically receiving items.
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* BULK Tracking Fields */}
            {selectedCategoryTrackingType === 'BULK' && (
              <>
                <div className="md:col-span-2">
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-green-900 mb-2">📊 Consumable Stock Details (Optional)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Minimum Stock Level
                        </label>
                        <input
                          type="number"
                          name="minimum_stock_level"
                          value={formData.minimum_stock_level}
                          onChange={handleChange}
                          min="0"
                          placeholder="Minimum quantity threshold"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Reorder Level
                        </label>
                        <input
                          type="number"
                          name="reorder_level"
                          value={formData.reorder_level}
                          onChange={handleChange}
                          min="0"
                          placeholder="When to reorder"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || hierarchicalCategories.length === 0}
            className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create & Link'}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
};

// Create Sub-Category Modal Component
const CreateSubCategoryModal = ({ onClose, onCreate, loading, contextMessage }) => {
  const [formData, setFormData] = useState({
    name: '',
    parent_category_id: '',
    description: '',
    depreciation_rate: '',
    depreciation_method: 'WDV',
  });
  const [broaderCategories, setBroaderCategories] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetchBroaderCategories();
  }, []);

  const fetchBroaderCategories = async () => {
    try {
      setLoadingData(true);
      const data = await categoriesAPI.getBroaderCategories();
      // Handle both array and paginated responses
      const categories = Array.isArray(data) ? data : data.results || [];
      // Filter only active broader categories (those without parent_category)
      const broaderOnly = categories.filter(cat => cat.is_active && !cat.parent_category);
      setBroaderCategories(broaderOnly);
    } catch (err) {
      console.error('Error fetching broader categories:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'parent_category_id') {
      const parent = broaderCategories.find(cat => cat.id === parseInt(value));
      setSelectedParent(parent);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      parent_category_id: parseInt(formData.parent_category_id),
      description: formData.description,
    };

    // Only add depreciation for fixed assets (INDIVIDUAL tracking)
    if (selectedParent?.tracking_type === 'INDIVIDUAL' && formData.depreciation_rate) {
      payload.depreciation_rate = parseFloat(formData.depreciation_rate);
      payload.depreciation_method = formData.depreciation_method;
    }

    onCreate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-xl w-full">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-lg">
          <h3 className="text-sm font-semibold text-gray-900">Create Sub-Category</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {contextMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs text-blue-800">
                <strong>ℹ️ Context:</strong> {contextMessage}
              </p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-300 rounded-lg p-2">
            <p className="text-xs text-amber-800">
              <strong>💡 Note:</strong> Sub-categories help organize items under broader categories.
              For example: "Furniture" (broader) → "Office Chairs", "Desks" (sub-categories).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Broader Category (Parent) <span className="text-red-500">*</span>
              </label>
              <select
                name="parent_category_id"
                value={formData.parent_category_id}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={loadingData}
              >
                <option value="">Select broader category</option>
                {broaderCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.tracking_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sub-Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Laptops, Office Chairs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {selectedParent?.tracking_type === 'INDIVIDUAL' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
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
                    placeholder="10.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Depreciation Method
                  </label>
                  <select
                    name="depreciation_method"
                    value={formData.depreciation_method}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="WDV">Written Down Value (WDV)</option>
                    <option value="SLM">Straight Line Method (SLM)</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Sub-Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Item Details Modal Component
const ItemDetailsModal = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Item Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <p className="text-gray-900 mt-0.5">{item.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Code:</span>
              <p className="text-gray-900 mt-0.5 font-mono">{item.code}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Category:</span>
              <p className="text-gray-900 mt-0.5">{item.category_name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Unit:</span>
              <p className="text-gray-900 mt-0.5">{item.acct_unit}</p>
            </div>
            {item.description && (
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Description:</span>
                <p className="text-gray-900 mt-0.5">{item.description}</p>
              </div>
            )}
            {item.specifications && (
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Specifications:</span>
                <p className="text-gray-900 mt-0.5">{item.specifications}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionStage3Form;
