// src/pages/Acknowledgments/AcknowledgmentForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CheckCircle, XCircle, AlertCircle, Package, MapPin, 
  Calendar, User, FileText, ArrowLeft, Save 
} from 'lucide-react';
import { stockEntriesAPI } from '../../api/stockEntries';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AcknowledgmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [returnEntryNumber, setReturnEntryNumber] = useState('');

  const [stockEntry, setStockEntry] = useState(null);
  const [trackingType, setTrackingType] = useState(null);
  
  // For INDIVIDUAL tracking
  const [instances, setInstances] = useState([]);
  const [selectedAccepted, setSelectedAccepted] = useState([]);
  const [selectedRejected, setSelectedRejected] = useState([]);
  
  // For BULK/BATCH tracking
  const [acceptedQuantity, setAcceptedQuantity] = useState(0);
  const [rejectedQuantity, setRejectedQuantity] = useState(0);
  
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchStockEntry();
  }, [id]);

  const fetchStockEntry = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await stockEntriesAPI.get(id);
      
      if (data.status !== 'PENDING_ACK') {
        setError('This entry is not pending acknowledgment');
        return;
      }

      setStockEntry(data);
      setTrackingType(data.item_tracking_type);
      
      if (data.item_tracking_type === 'INDIVIDUAL') {
        setInstances(data.instances_details || []);
        setSelectedAccepted(data.instances_details?.map(i => i.id) || []);
      } else {
        setAcceptedQuantity(data.quantity);
        setRejectedQuantity(0);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load stock entry');
    } finally {
      setLoading(false);
    }
  };

  const handleInstanceToggle = (instanceId, action) => {
    if (action === 'accept') {
      if (selectedAccepted.includes(instanceId)) {
        setSelectedAccepted(selectedAccepted.filter(id => id !== instanceId));
      } else {
        setSelectedAccepted([...selectedAccepted, instanceId]);
        setSelectedRejected(selectedRejected.filter(id => id !== instanceId));
      }
    } else {
      if (selectedRejected.includes(instanceId)) {
        setSelectedRejected(selectedRejected.filter(id => id !== instanceId));
      } else {
        setSelectedRejected([...selectedRejected, instanceId]);
        setSelectedAccepted(selectedAccepted.filter(id => id !== instanceId));
      }
    }
  };

  const handleQuantityChange = (type, value) => {
    const qty = parseInt(value) || 0;
    const total = stockEntry.quantity;
    
    if (type === 'accepted') {
      const newAccepted = Math.min(Math.max(0, qty), total);
      setAcceptedQuantity(newAccepted);
      setRejectedQuantity(total - newAccepted);
    } else {
      const newRejected = Math.min(Math.max(0, qty), total);
      setRejectedQuantity(newRejected);
      setAcceptedQuantity(total - newRejected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (trackingType === 'INDIVIDUAL') {
      if (selectedAccepted.length === 0 && selectedRejected.length === 0) {
        setError('Please accept or reject at least one item');
        return;
      }
      
      if (selectedRejected.length > 0 && !rejectionReason.trim()) {
        setError('Please provide a rejection reason');
        return;
      }
    } else {
      if (acceptedQuantity + rejectedQuantity !== stockEntry.quantity) {
        setError(`Total must equal ${stockEntry.quantity}`);
        return;
      }
      
      if (rejectedQuantity > 0 && !rejectionReason.trim()) {
        setError('Please provide a rejection reason');
        return;
      }
    }

    try {
      setSaving(true);
      setError('');

      const payload = trackingType === 'INDIVIDUAL' 
        ? {
            accepted_instances: selectedAccepted,
            rejected_instances: selectedRejected,
            rejection_reason: rejectionReason
          }
        : {
            accepted_quantity: acceptedQuantity,
            rejected_quantity: rejectedQuantity,
            rejection_reason: rejectionReason
          };

      const response = await stockEntriesAPI.acknowledgeReceipt(id, payload);

      // Check if return entry was created for rejected items
      if (response.rejected && response.rejected.return_entry) {
        setReturnEntryNumber(response.rejected.return_entry);
        setSuccess(
          `Acknowledgment processed! ${response.accepted?.count || 0} items accepted. ` +
          `${response.rejected?.count || 0} items rejected.`
        );
      } else {
        setSuccess('Acknowledgment processed successfully!');
        setTimeout(() => navigate('/dashboard/acknowledgments'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process acknowledgment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (error && !stockEntry) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-red-800">Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/acknowledgments')}
          className="mt-3 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-3">
        <button
          onClick={() => navigate('/dashboard/acknowledgments')}
          className="flex items-center text-xs text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to Acknowledgments
        </button>
        <h1 className="text-sm font-bold text-gray-900">Acknowledge Receipt</h1>
        <p className="text-xs text-gray-600 mt-0.5">
          Review and confirm received items
        </p>
      </div>

      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-red-800">Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-2 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-green-800">Success</p>
            <p className="text-xs text-green-600 mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {returnEntryNumber && (
        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-900">Return Entry Created</p>
            <p className="text-xs text-blue-700 mt-0.5">
              A return entry <span className="font-semibold">{returnEntryNumber}</span> has been created for the rejected items.
              You need to acknowledge receipt of these returned items.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard/returns')}
              className="mt-2 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
            >
              Go to Return Acknowledgments
            </button>
          </div>
        </div>
      )}

      {/* Entry Details Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Entry Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Entry Number</p>
              <p className="text-xs font-medium text-gray-900">{stockEntry?.entry_number}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Item</p>
              <p className="text-xs font-medium text-gray-900">{stockEntry?.item_name}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {stockEntry?.item_tracking_type_display}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">From Location</p>
              <p className="text-xs font-medium text-gray-900">{stockEntry?.from_location_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">To Location</p>
              <p className="text-xs font-medium text-gray-900">{stockEntry?.to_location_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Sent By</p>
              <p className="text-xs font-medium text-gray-900">{stockEntry?.created_by_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Entry Date</p>
              <p className="text-xs font-medium text-gray-900">
                {new Date(stockEntry?.entry_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acknowledgment Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">
            {trackingType === 'INDIVIDUAL' ? 'Select Items Status' : 'Specify Quantities'}
          </h2>

          {trackingType === 'INDIVIDUAL' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-700">
                  Total Items: {instances.length}
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center text-gray-700">
                    Accepted: {selectedAccepted.length}
                  </span>
                  <span className="flex items-center text-gray-700">
                    Rejected: {selectedRejected.length}
                  </span>
                </div>
              </div>

              <div className="space-y-1 max-h-80 overflow-y-auto">
                {instances.map((instance) => {
                  const isAccepted = selectedAccepted.includes(instance.id);
                  const isRejected = selectedRejected.includes(instance.id);
                  
                  return (
                    <div
                      key={instance.id}
                      className="border border-gray-200 rounded-lg p-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900">
                            {instance.instance_code}
                          </p>
                          {instance.serial_number && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              Serial: {instance.serial_number}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleInstanceToggle(instance.id, 'accept')}
                            className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                              isAccepted
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInstanceToggle(instance.id, 'reject')}
                            className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                              isRejected
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="border border-gray-200 rounded-lg p-2">
                  <p className="text-xs text-gray-600 mb-0.5">Total Sent</p>
                  <p className="text-base font-bold text-gray-900">
                    {stockEntry?.quantity}
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-2">
                  <label className="text-xs text-gray-700 mb-0.5 block font-medium">Accepted</label>
                  <input
                    type="number"
                    min="0"
                    max={stockEntry?.quantity}
                    value={acceptedQuantity}
                    onChange={(e) => handleQuantityChange('accepted', e.target.value)}
                    className="w-full text-base font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div className="border border-gray-200 rounded-lg p-2">
                  <label className="text-xs text-gray-700 mb-0.5 block font-medium">Rejected</label>
                  <input
                    type="number"
                    min="0"
                    max={stockEntry?.quantity}
                    value={rejectedQuantity}
                    onChange={(e) => handleQuantityChange('rejected', e.target.value)}
                    className="w-full text-base font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {acceptedQuantity + rejectedQuantity !== stockEntry?.quantity && (
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
                  <p className="text-xs text-gray-700">
                    ⚠️ Total must equal {stockEntry?.quantity}. Currently: {acceptedQuantity + rejectedQuantity}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Rejection Reason */}
          {((trackingType === 'INDIVIDUAL' && selectedRejected.length > 0) || 
            (trackingType !== 'INDIVIDUAL' && rejectedQuantity > 0)) && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Explain why items are being rejected..."
                required
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/acknowledgments')}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || success}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                Processing...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Submitted
              </>
            ) : (
              <>
                <Save className="w-3 h-3 mr-1" />
                Submit Acknowledgment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AcknowledgmentForm;