// src/pages/InterStoreRequests/RequestDetails.jsx - UPDATED VERSION
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, MapPin, AlertCircle, CheckCircle, XCircle,
  Clock, User, FileText, Send, Check, X, Loader
} from 'lucide-react';
import { interStoreRequestsAPI } from '../../api/interStoreRequests';
import { stockEntriesAPI } from '../../api/stockEntries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [request, setRequest] = useState(null);

  // Mode states
  const [availabilityMode, setAvailabilityMode] = useState(false);
  const [dispatchMode, setDispatchMode] = useState(false);
  const [ackMode, setAckMode] = useState(false);

  // Availability marking data
  const [availabilityData, setAvailabilityData] = useState({});

  // Dispatch data
  const [dispatchData, setDispatchData] = useState({});

  // Stock data for dispatch (instances, batches, quantities)
  const [stockData, setStockData] = useState({});

  // Acknowledgment data
  const [ackRemarks, setAckRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const data = await interStoreRequestsAPI.getById(id);
      setRequest(data);

      // Initialize availability data
      const availData = {};
      data.items.forEach(item => {
        availData[item.id] = {
          item_id: item.id,
          is_available: item.is_available,
          unavailability_reason: item.unavailability_reason || ''
        };
      });
      setAvailabilityData(availData);

    } catch (err) {
      setError('Failed to load request details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcessing = async () => {
    try {
      setSaving(true);
      setError('');

      await interStoreRequestsAPI.startProcessing(id);
      await fetchRequestDetails();
      setAvailabilityMode(true);
      setSuccess('Started processing. Mark item availability.');

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start processing');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAvailability = async () => {
    try {
      setSaving(true);
      setError('');

      const items = Object.values(availabilityData);

      const response = await interStoreRequestsAPI.markAvailability(id, items);

      // Check if request was auto-rejected (all items unavailable)
      if (response.auto_rejected) {
        setSuccess('All items marked as unavailable. Request has been automatically rejected.');
      } else {
        setSuccess('Availability marked successfully');
      }

      setAvailabilityMode(false);
      await fetchRequestDetails();

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark availability');
    } finally {
      setSaving(false);
    }
  };

  const handleContinueToDispatch = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await interStoreRequestsAPI.continueToDispatch(id);
      setSuccess(response.message);
      setDispatchMode(true);

      // Fetch stock data for available items
      setSuccess('Loading available stock...');
      await fetchStockForAvailableItems();
      setSuccess('Stock loaded. Select items to dispatch.');

    } catch (err) {
      setError(err.response?.data?.error || 'Cannot proceed to dispatch');
      console.error('Continue to dispatch error:', err);
    } finally {
      setSaving(false);
    }
  };

  const fetchStockForAvailableItems = async () => {
      if (!request) return;

      const availableItems = request.items.filter(item => item.is_available);
      const stockDataTemp = {};

      console.log('Fetching stock for available items:', availableItems);
      console.log('Fulfilling store ID:', request.fulfilling_store);

      for (const item of availableItems) {
        try {
          console.log(`Fetching stock for item ${item.item_name} (ID: ${item.item})`);

          const data = await stockEntriesAPI.getItemStock({
            from_location: request.fulfilling_store,
            item: item.item
          });

          console.log(`Stock data for ${item.item_name}:`, data);

          // CRITICAL: Use tracking_type from API response (it's authoritative)
          const actualTrackingType = data.tracking_type;
          
          // Calculate available based on tracking type
          let available = 0;
          if (actualTrackingType === 'INDIVIDUAL') {
            available = data.instances?.length || 0;
          } else if (actualTrackingType === 'BATCH') {
            available = data.total_available || 0;
          } else if (actualTrackingType === 'BULK') {
            available = data.available_quantity || 0;
          }

          stockDataTemp[item.id] = {
            tracking_type: actualTrackingType, // Use API response, not item property
            available: available,
            instances: data.instances || [],
            batches: data.batches || [],
            quantity: data.available_quantity || 0,
            total_quantity: data.total_quantity || 0
          };

          console.log(`Processed stock for ${item.item_name}: tracking=${actualTrackingType}, available=${available}`);

        } catch (err) {
          console.error(`Failed to fetch stock for item ${item.item_name}:`, err);
          console.error('Error response:', err.response?.data);

          // Show error to user
          setError(`Failed to fetch stock for ${item.item_name}: ${err.response?.data?.detail || err.message}`);

          stockDataTemp[item.id] = {
            tracking_type: item.tracking_type || 'BULK',
            available: 0,
            instances: [],
            batches: [],
            quantity: 0
          };
        }
      }

      console.log('Final stock data:', stockDataTemp);
      setStockData(stockDataTemp);
    };

  const handleDispatchItems = async () => {
    try {
      setSaving(true);
      setError('');

      const dispatches = Object.values(dispatchData);

      console.log('[DISPATCH] Sending dispatch data:', JSON.stringify(dispatches, null, 2));
      console.log('[DISPATCH] Number of items to dispatch:', dispatches.length);

      // Validate that we have items to dispatch
      if (dispatches.length === 0) {
        setError('Please select items to dispatch');
        setSaving(false);
        return;
      }

      // Validate each dispatch has required fields
      for (let i = 0; i < dispatches.length; i++) {
        const dispatch = dispatches[i];
        console.log(`[DISPATCH] Validating item ${i + 1}:`, dispatch);

        if (!dispatch.item_id) {
          setError(`Item ${i + 1}: Missing item_id`);
          setSaving(false);
          return;
        }

        if (!dispatch.dispatched_quantity) {
          setError(`Item ${i + 1}: Missing dispatched_quantity`);
          setSaving(false);
          return;
        }
      }

      await interStoreRequestsAPI.dispatchItems(id, dispatches);
      setSuccess('Items dispatched successfully');
      setDispatchMode(false);
      await fetchRequestDetails();

    } catch (err) {
      console.error('[DISPATCH ERROR] Full error:', err);
      console.error('[DISPATCH ERROR] Response data:', err.response?.data);
      console.error('[DISPATCH ERROR] Response status:', err.response?.status);

      // Extract detailed error message
      let errorMsg = 'Failed to dispatch items';

      if (err.response?.data) {
        // Check for validation errors (array format)
        if (Array.isArray(err.response.data)) {
          errorMsg = 'Validation errors:\n' + err.response.data.map((e, i) => {
            if (typeof e === 'object') {
              return `Item ${i + 1}: ${JSON.stringify(e)}`;
            }
            return `Item ${i + 1}: ${e}`;
          }).join('\n');
        }
        // Check for single error message
        else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        }
        else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        }
        // Stringify entire response if it's an object
        else if (typeof err.response.data === 'object') {
          errorMsg = JSON.stringify(err.response.data, null, 2);
        }
        else {
          errorMsg = err.response.data.toString();
        }
      }

      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleAcknowledge = async (action) => {
    try {
      setSaving(true);
      setError('');

      const remarks = action === 'ACCEPT' ? ackRemarks : rejectionReason;
      await interStoreRequestsAPI.acknowledge(id, action, remarks);
      setSuccess(action === 'ACCEPT' ? 'Items acknowledged successfully' : 'Items rejected');
      setAckMode(false);
      await fetchRequestDetails();

    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    try {
      setSaving(true);
      setError('');

      await interStoreRequestsAPI.cancel(id);
      setSuccess('Request cancelled');
      await fetchRequestDetails();

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel request');
    } finally {
      setSaving(false);
    }
  };

  // Helper functions
  const getStatusBadge = (status) => {
    const configs = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', text: 'In Progress' },
      PROCESSING: { color: 'bg-indigo-100 text-indigo-800', text: 'Processing' },
      PARTIALLY_DISPATCHED: { color: 'bg-purple-100 text-purple-800', text: 'Partially Dispatched' },
      DISPATCHED: { color: 'bg-green-100 text-green-800', text: 'Dispatched' },
      ACKNOWLEDGED: { color: 'bg-emerald-100 text-emerald-800', text: 'Acknowledged ✓' },
      REJECTED: { color: 'bg-red-100 text-red-800', text: 'Rejected ✗' },
      CANCELLED: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' },
    };

    const config = configs[status] || configs.PENDING;

    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const configs = {
      LOW: { color: 'bg-gray-100 text-gray-700', text: 'Low' },
      NORMAL: { color: 'bg-blue-100 text-blue-700', text: 'Normal' },
      HIGH: { color: 'bg-orange-100 text-orange-700', text: 'High' },
      URGENT: { color: 'bg-red-100 text-red-700', text: 'Urgent' },
    };

    const config = configs[priority] || configs.NORMAL;

    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canStartProcessing = () => {
    return request?.status === 'PENDING' &&
           user?.accessible_stores?.some(s => s.id === request.fulfilling_store);
  };

  const canContinueToDispatch = () => {
    if (request?.status !== 'PROCESSING') return false;
    if (!user?.accessible_stores?.some(s => s.id === request.fulfilling_store)) return false;

    // All items must be reviewed (either marked available OR marked N/A)
    const allReviewed = request.items.every(item =>
      item.status === 'NOT_AVAILABLE' || item.is_available === true
    );

    // At least one item must be available for dispatch
    const hasAvailable = request.items.some(item => item.is_available === true);

    return allReviewed && hasAvailable;
  };

  const canEditAvailability = () => {
    // Can edit availability ONLY when status is PROCESSING (not DISPATCHED or later)
    // and user has access to fulfilling store
    const allowedStatuses = ['PROCESSING'];
    return request?.status && allowedStatuses.includes(request.status) &&
           user?.accessible_stores?.some(s => s.id === request.fulfilling_store);
  };

  const canAcknowledge = () => {
    // Acknowledgment is now handled via the Acknowledgments section (stock entries)
    // This redundant acknowledgment flow is disabled
    return false;

    // OLD LOGIC (disabled to prevent redundancy):
    // return (request?.status === 'DISPATCHED' || request?.status === 'PARTIALLY_DISPATCHED') &&
    //        user?.accessible_stores?.some(s => s.id === request.requesting_store);
  };

  const canCancel = () => {
    return (request?.status === 'PENDING' || request?.status === 'DRAFT') &&
           user?.accessible_stores?.some(s => s.id === request.requesting_store);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!request) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-gray-600">Request not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/store-requests')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">{request.request_number}</h1>
            <p className="text-xs text-gray-600 mt-0">Request Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(request.status)}
          {getPriorityBadge(request.priority)}
        </div>
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

      {/* Actions */}
      {!availabilityMode && !dispatchMode && !ackMode && (
        <div className="space-y-2">
          {/* Info banner for dispatched/completed requests */}
          {(request?.status === 'DISPATCHED' || request?.status === 'PARTIALLY_DISPATCHED') && (
            <div className="bg-purple-50 border border-purple-200 text-purple-700 px-2 py-1.5 rounded-lg text-xs">
              <strong>📦 Dispatched:</strong> Items sent. Go to <strong>Acknowledgments</strong> to accept/reject.
            </div>
          )}

          {request?.status === 'ACKNOWLEDGED' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-2 py-1.5 rounded-lg text-xs">
              <strong>✓ Completed:</strong> All items have been acknowledged. This request is complete.
            </div>
          )}

          {request?.status === 'REJECTED' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs">
              <strong>✗ Rejected:</strong> Items have been rejected.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {canStartProcessing() && (
              <button
                onClick={handleStartProcessing}
                disabled={saving}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-1"
              >
                <Package className="h-3 w-3" />
                Start Processing
              </button>
            )}

            {canEditAvailability() && (
              <button
                onClick={() => setAvailabilityMode(true)}
                disabled={saving}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-1"
              >
                <Package className="h-3 w-3" />
                Edit Availability
              </button>
            )}

            {canContinueToDispatch() && (
              <button
                onClick={handleContinueToDispatch}
                disabled={saving}
                className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:bg-gray-300 flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                Continue to Dispatch
              </button>
            )}

            {canAcknowledge() && (
              <button
                onClick={() => setAckMode(true)}
                disabled={saving}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Acknowledge Receipt
              </button>
            )}

            {canCancel() && (
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-gray-300 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Cancel Request
              </button>
            )}
          </div>
        </div>
      )}

      {/* Request Information */}
      <div className="grid grid-cols-2 gap-2">
        {/* Requesting Store */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-semibold text-gray-900">Requesting Store</span>
          </div>
          <p className="text-xs text-gray-900">{request.requesting_store_name}</p>
          <p className="text-xs text-gray-600">{request.requesting_store_code}</p>
        </div>

        {/* Fulfilling Store */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center gap-1 mb-1">
            <Package className="h-3 w-3 text-green-600" />
            <span className="text-xs font-semibold text-gray-900">Fulfilling Store</span>
          </div>
          <p className="text-xs text-gray-900">{request.fulfilling_store_name}</p>
          <p className="text-xs text-gray-600">{request.fulfilling_store_code}</p>
        </div>
      </div>

      {/* Purpose & Remarks */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <h3 className="text-xs font-semibold text-gray-900 mb-1">Purpose</h3>
        <p className="text-xs text-gray-700">{request.purpose}</p>
        {request.remarks && (
          <>
            <h3 className="text-xs font-semibold text-gray-900 mt-2 mb-1">Remarks</h3>
            <p className="text-xs text-gray-700">{request.remarks}</p>
          </>
        )}
        {request.rejection_reason && (
          <>
            <h3 className="text-xs font-semibold text-red-900 mt-2 mb-1">Rejection Reason</h3>
            <p className="text-xs text-red-700 whitespace-pre-line">{request.rejection_reason}</p>
          </>
        )}
      </div>

      {/* Items Summary */}
      {request.items && request.items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">Items Summary</h3>
          <div className="flex flex-wrap gap-2">
            <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
              Total: {request.items.length}
            </div>
            {request.items.filter(i => i.is_available).length > 0 && (
              <div className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
                ✓ Available: {request.items.filter(i => i.is_available).length}
              </div>
            )}
            {request.items.filter(i => !i.is_available).length > 0 && (
              <div className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
                ✗ N/A: {request.items.filter(i => !i.is_available).length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Availability Marking Interface */}
      {availabilityMode && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Mark Item Availability</h3>
          <p className="text-xs text-gray-600 mb-2">
            Review each item and mark as Available or N/A. Provide reason if item is not available.
          </p>
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <strong>Note:</strong> You can modify availability multiple times before dispatching. After saving, use "Edit Availability" to make changes.
          </div>

          <div className="space-y-3">
            {request.items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded p-2">
                <div className="flex items-start gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-gray-900">
                      {item.item_name} ({item.item_code})
                    </h4>
                    <p className="text-xs text-gray-600">
                      {item.item_category} • {item.tracking_type}
                    </p>
                    <p className="text-xs text-gray-600">
                      Requested: {item.requested_quantity} units
                    </p>
                  </div>
                </div>

                {/* Availability Radio Buttons */}
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`availability_${item.id}`}
                      checked={availabilityData[item.id]?.is_available === true}
                      onChange={() => {
                        setAvailabilityData(prev => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            item_id: item.id,
                            is_available: true,
                            unavailability_reason: ''
                          }
                        }));
                      }}
                      className="h-3 w-3"
                    />
                    <span className="text-xs text-green-700 font-medium">✓ Available</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`availability_${item.id}`}
                      checked={availabilityData[item.id]?.is_available === false}
                      onChange={() => {
                        setAvailabilityData(prev => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            item_id: item.id,
                            is_available: false,
                            unavailability_reason: prev[item.id]?.unavailability_reason || ''
                          }
                        }));
                      }}
                      className="h-3 w-3"
                    />
                    <span className="text-xs text-red-700 font-medium">✗ Not Available</span>
                  </label>
                </div>

                {/* Unavailability Reason */}
                {availabilityData[item.id]?.is_available === false && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Reason (required)
                    </label>
                    <textarea
                      value={availabilityData[item.id]?.unavailability_reason || ''}
                      onChange={(e) => {
                        setAvailabilityData(prev => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            unavailability_reason: e.target.value
                          }
                        }));
                      }}
                      placeholder="e.g., Out of stock, ordered new batch"
                      rows={2}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleMarkAvailability}
              disabled={saving}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              {saving ? 'Saving...' : 'Save Availability'}
            </button>
            <button
              onClick={() => setAvailabilityMode(false)}
              disabled={saving}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dispatch Interface */}
      {dispatchMode && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Dispatch Items</h3>
          <p className="text-xs text-gray-600 mb-3">
            Select instances, batches, or enter quantities to dispatch based on tracking type.
          </p>

          {saving && (
            <div className="mb-3 p-2 bg-blue-50 text-blue-700 text-xs rounded">
              Loading available stock...
            </div>
          )}

          {Object.keys(stockData).length === 0 && !saving && (
            <div className="mb-3 p-2 bg-yellow-50 text-yellow-700 text-xs rounded">
              No stock data loaded. Click "Continue to Dispatch" again to retry.
            </div>
          )}

          <div className="space-y-3">
            {request.items.filter(item => item.is_available).map((item) => {
              const stock = stockData[item.id] || {};
              // Use tracking type from item, or fallback to stock data, or category
              const trackingType = item.tracking_type || stock.tracking_type || 'BULK';

              console.log(`Rendering item ${item.item_name}:`, {
                item_tracking_type: item.tracking_type,
                stock_tracking_type: stock.tracking_type,
                final_tracking_type: trackingType,
                stock_data: stock,
                instances_count: stock.instances?.length || 0,
                batches_count: stock.batches?.length || 0,
                quantity: stock.quantity
              });

              return (
                <div key={item.id} className="border border-gray-200 rounded p-2">
                  <div className="flex items-start gap-2 mb-2">
                    <Package className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-gray-900">
                        {item.item_name} ({item.item_code})
                      </h4>
                      <p className="text-xs text-gray-600">
                        {item.item_category} • {trackingType}
                      </p>
                      <p className="text-xs text-gray-600">
                        Requested: {item.requested_quantity} | Available: {stock.available || 0}
                      </p>
                      {/* Debug info */}
                      <p className="text-xs text-gray-500 mt-1">
                        [DEBUG] Stock data: instances={stock.instances?.length || 0}, batches={stock.batches?.length || 0}, qty={stock.quantity || 0}
                      </p>
                    </div>
                  </div>

                  {/* INDIVIDUAL - Instance Selection */}
                  {trackingType === 'INDIVIDUAL' && (
                    <div>
                      {/* Quick Select by Quantity */}
                      {stock.instances && stock.instances.length > 0 && (
                        <div className="mb-3 p-2.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                          <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                            Quick Select by Quantity
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={Math.min(stock.instances.length, item.requested_quantity)}
                              value={dispatchData[item.id]?.instance_ids?.length || 0}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 0;
                                const newInstanceIds = stock.instances.slice(0, qty).map(i => i.id);

                                setDispatchData(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    item_id: item.id,
                                    instance_ids: newInstanceIds,
                                    dispatched_quantity: newInstanceIds.length.toString()
                                  }
                                }));
                              }}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="flex-1">
                              <p className="text-xs text-gray-700">
                                Auto-select first <strong>{dispatchData[item.id]?.instance_ids?.length || 0}</strong> instance(s)
                              </p>
                              <p className="text-xs text-gray-500">
                                Max: {Math.min(stock.instances.length, item.requested_quantity)} (requested: {item.requested_quantity})
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-gray-700">
                          Manual Selection ({dispatchData[item.id]?.instance_ids?.length || 0} selected)
                        </label>

                        {stock.instances && stock.instances.length > 0 && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const maxQty = Math.min(stock.instances.length, item.requested_quantity);
                                const allIds = stock.instances.slice(0, maxQty).map(i => i.id);
                                setDispatchData(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    item_id: item.id,
                                    instance_ids: allIds,
                                    dispatched_quantity: allIds.length.toString()
                                  }
                                }));
                              }}
                              className="px-2 py-0.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                            >
                              Select Max
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDispatchData(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    item_id: item.id,
                                    instance_ids: [],
                                    dispatched_quantity: '0'
                                  }
                                }));
                              }}
                              className="px-2 py-0.5 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      {!stock.instances ? (
                        <p className="text-xs text-orange-600">Loading instances...</p>
                      ) : stock.instances.length > 0 ? (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {stock.instances.map((instance) => {
                            const isSelected = dispatchData[item.id]?.instance_ids?.includes(instance.id) || false;
                            return (
                              <label
                                key={instance.id}
                                className={`flex items-start gap-2 p-1.5 rounded cursor-pointer border transition-all ${
                                  isSelected
                                    ? 'bg-primary-50 border-primary-500'
                                    : 'hover:bg-gray-50 border-transparent'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setDispatchData(prev => {
                                      const current = prev[item.id] || { item_id: item.id, instance_ids: [] };
                                      const instanceIds = checked
                                        ? [...(current.instance_ids || []), instance.id]
                                        : (current.instance_ids || []).filter(id => id !== instance.id);

                                      return {
                                        ...prev,
                                        [item.id]: {
                                          ...current,
                                          instance_ids: instanceIds,
                                          dispatched_quantity: instanceIds.length.toString()
                                        }
                                      };
                                    });
                                  }}
                                  className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                                />
                                <div className="flex-1">
                                  <span className="text-xs text-gray-900 font-medium">
                                    {instance.instance_code}
                                  </span>
                                  <span className="text-xs text-gray-600 ml-2">
                                    {instance.location_name}
                                  </span>
                                </div>
                                {isSelected && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-primary-600 text-white rounded-full">
                                    Selected
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs text-red-700 font-medium">⚠ No instances available</p>
                          <p className="text-xs text-red-600 mt-1">
                            This item has no stock at the fulfilling store. Create stock entries first.
                          </p>
                        </div>
                      )}
                      {dispatchData[item.id]?.instance_ids?.length > 0 && (
                        <p className="text-xs text-green-600 font-medium mt-1.5">
                          ✓ Selected: {dispatchData[item.id].instance_ids.length} instance(s)
                        </p>
                      )}
                    </div>
                  )}

                  {/* BATCH - Batch Selection with Quantities */}
                  {trackingType === 'BATCH' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Select Batches and Quantities:
                      </label>
                      {!stock.batches ? (
                        <p className="text-xs text-orange-600">Loading batches...</p>
                      ) : stock.batches.length > 0 ? (
                        <div className="space-y-2">
                          {stock.batches.map((batch) => (
                            <div key={batch.id} className="border border-gray-200 rounded p-2">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <span className="text-xs font-medium text-gray-900">
                                    Batch: {batch.batch_number}
                                  </span>
                                  {batch.expiry_date && (
                                    <span className="text-xs text-gray-600 ml-2">
                                      Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-600">
                                  Available: {batch.available_quantity}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={batch.available_quantity}
                                  value={
                                    dispatchData[item.id]?.batch_allocations?.find(
                                      b => b.batch_id === batch.id
                                    )?.quantity || ''
                                  }
                                  onChange={(e) => {
                                    const qty = e.target.value ? parseFloat(e.target.value) : 0;
                                    setDispatchData(prev => {
                                      const current = prev[item.id] || { item_id: item.id, batch_allocations: [] };
                                      const allocations = current.batch_allocations || [];

                                      const existingIdx = allocations.findIndex(b => b.batch_id === batch.id);
                                      let newAllocations;

                                      if (qty > 0) {
                                        if (existingIdx >= 0) {
                                          newAllocations = [...allocations];
                                          newAllocations[existingIdx] = { batch_id: batch.id, quantity: qty };
                                        } else {
                                          newAllocations = [...allocations, { batch_id: batch.id, quantity: qty }];
                                        }
                                      } else {
                                        newAllocations = allocations.filter(b => b.batch_id !== batch.id);
                                      }

                                      const totalQty = newAllocations.reduce((sum, b) => sum + b.quantity, 0);

                                      return {
                                        ...prev,
                                        [item.id]: {
                                          ...current,
                                          batch_allocations: newAllocations,
                                          dispatched_quantity: totalQty.toString()
                                        }
                                      };
                                    });
                                  }}
                                  placeholder="Qty"
                                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-xs text-gray-600">units</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs text-red-700 font-medium">⚠ No batches available</p>
                          <p className="text-xs text-red-600 mt-1">
                            This item has no batch stock at the fulfilling store. Create stock entries first.
                          </p>
                        </div>
                      )}
                      {dispatchData[item.id]?.batch_allocations?.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          Total: {dispatchData[item.id].batch_allocations.reduce((sum, b) => sum + b.quantity, 0)} units
                        </p>
                      )}
                    </div>
                  )}

                  {/* BULK - Quantity Input */}
                  {trackingType === 'BULK' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity to Dispatch:
                      </label>
                      {stock.quantity === undefined || stock.quantity === null ? (
                        <p className="text-xs text-orange-600">Loading quantity...</p>
                      ) : stock.quantity > 0 ? (
                        <>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={stock.quantity || 0}
                              value={dispatchData[item.id]?.dispatched_quantity || ''}
                              onChange={(e) => {
                                const qty = e.target.value;
                                setDispatchData(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    item_id: item.id,
                                    dispatched_quantity: qty,
                                    quantity_numeric: qty ? parseFloat(qty) : 0
                                  }
                                }));
                              }}
                              placeholder="Enter quantity"
                              className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600">
                              / {stock.quantity || 0} available
                            </span>
                          </div>
                          {dispatchData[item.id]?.dispatched_quantity && (
                            <p className="text-xs text-blue-600 mt-1">
                              {parseFloat(dispatchData[item.id].dispatched_quantity) < parseFloat(item.requested_quantity)
                                ? '⚠ Partial fulfillment'
                                : '✓ Full fulfillment'}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs text-red-700 font-medium">⚠ No stock available</p>
                          <p className="text-xs text-red-600 mt-1">
                            This item has zero quantity at the fulfilling store. Create stock entries first.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dispatch Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDispatchItems}
              disabled={saving || Object.keys(dispatchData).length === 0}
              className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:bg-gray-300"
            >
              {saving ? 'Dispatching...' : 'Dispatch Items'}
            </button>
            <button
              onClick={() => {
                setDispatchMode(false);
                setAvailabilityMode(true);
              }}
              disabled={saving}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              Back to Availability
            </button>
            <button
              onClick={() => setDispatchMode(false)}
              disabled={saving}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Acknowledgment Interface */}
      {ackMode && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Acknowledge Receipt</h3>
          <p className="text-xs text-gray-600 mb-3">
            Review received items and accept or reject them.
          </p>

          {/* Items List */}
          <div className="mb-3 space-y-2">
            {request.items.filter(item => item.status === 'DISPATCHED').map((item) => (
              <div key={item.id} className="border border-gray-200 rounded p-2">
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-gray-900">
                      {item.item_name} ({item.item_code})
                    </h4>
                    <p className="text-xs text-gray-600">
                      Dispatched: {item.dispatched_quantity} units
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Remarks Input */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Remarks (Optional for Accept, Required for Reject)
            </label>
            <textarea
              value={ackRemarks || rejectionReason}
              onChange={(e) => {
                setAckRemarks(e.target.value);
                setRejectionReason(e.target.value);
              }}
              placeholder="Enter any remarks or reason for rejection..."
              rows={3}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Acknowledgment Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAcknowledge('ACCEPT')}
              disabled={saving}
              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              {saving ? 'Processing...' : 'Accept Items'}
            </button>
            <button
              onClick={() => {
                if (!rejectionReason.trim()) {
                  setError('Please provide a reason for rejection');
                  return;
                }
                handleAcknowledge('REJECT');
              }}
              disabled={saving}
              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-gray-300 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              {saving ? 'Processing...' : 'Reject Items'}
            </button>
            <button
              onClick={() => {
                setAckMode(false);
                setAckRemarks('');
                setRejectionReason('');
              }}
              disabled={saving}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Items List (Default View) */}
      {!availabilityMode && !dispatchMode && !ackMode && (
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">Requested Items</h3>

          <div className="space-y-2">
            {request.items && request.items.length > 0 ? (
              request.items.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded p-2 hover:bg-gray-50"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900">
                            {item.item_name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            Code: {item.item_code} • Category: {item.item_category}
                          </p>
                          <p className="text-xs text-gray-600">
                            Tracking: {item.tracking_type}
                          </p>
                        </div>
                        <div className="text-right">
                          {item.status === 'PENDING' && !item.is_available && (
                            <span className="inline-block px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                              Pending Review
                            </span>
                          )}
                          {item.is_available && item.status === 'PENDING' && (
                            <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              ✓ Available
                            </span>
                          )}
                          {!item.is_available && item.status === 'NOT_AVAILABLE' && (
                            <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                              ✗ Not Available
                            </span>
                          )}
                          {item.status === 'DISPATCHED' && (
                            <span className="inline-block px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                              Dispatched
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Requested:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {item.requested_quantity}
                          </span>
                        </div>
                        {item.dispatched_quantity && (
                          <div>
                            <span className="text-gray-600">Dispatched:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {item.dispatched_quantity}
                            </span>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-600">Notes:</span>
                          <p className="text-xs text-gray-700">{item.notes}</p>
                        </div>
                      )}

                      {item.unavailability_reason && (
                        <div className="mt-1 p-1.5 bg-red-50 rounded">
                          <span className="text-xs text-red-700 font-medium">Reason:</span>
                          <p className="text-xs text-red-700">{item.unavailability_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-600 text-center py-4">No items in this request</p>
            )}
          </div>
        </div>
      )}

      {/* Timeline / History */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <h3 className="text-xs font-semibold text-gray-900 mb-2">Timeline</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Clock className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-900">Created</p>
              <p className="text-xs text-gray-600">{formatDate(request.created_at)}</p>
              {request.created_by_name && (
                <p className="text-xs text-gray-600">by {request.created_by_name}</p>
              )}
            </div>
          </div>

          {request.updated_at && request.updated_at !== request.created_at && (
            <div className="flex items-start gap-2">
              <Clock className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-900">Last Updated</p>
                <p className="text-xs text-gray-600">{formatDate(request.updated_at)}</p>
              </div>
            </div>
          )}

          {request.acknowledgment_remarks && (
            <div className="flex items-start gap-2">
              <FileText className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-900">Acknowledgment Remarks</p>
                <p className="text-xs text-gray-700">{request.acknowledgment_remarks}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;
