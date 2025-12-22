// src/pages/Returns/ReturnAcknowledgmentForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CheckCircle, AlertCircle, Package, MapPin, Calendar, User, 
  FileText, ArrowLeft, Save, RotateCcw
} from 'lucide-react';
import { stockEntriesAPI } from '../../api/stockEntries';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ReturnAcknowledgmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [returnEntry, setReturnEntry] = useState(null);
  const [trackingType, setTrackingType] = useState(null);
  const [instances, setInstances] = useState([]);

  useEffect(() => {
    fetchReturnEntry();
  }, [id]);

  const fetchReturnEntry = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await stockEntriesAPI.get(id);
      
      if (data.entry_type !== 'RETURN') {
        setError('This is not a return entry');
        return;
      }

      if (data.status !== 'PENDING_ACK') {
        setError('This return is not pending acknowledgment');
        return;
      }

      setReturnEntry(data);
      setTrackingType(data.item_tracking_type);
      
      if (data.item_tracking_type === 'INDIVIDUAL') {
        setInstances(data.instances_details || []);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load return entry');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');

      // For returns, we acknowledge all items (no partial acknowledgment)
      const payload = trackingType === 'INDIVIDUAL' 
        ? { accepted_instances: instances.map(i => i.id) }
        : {};

      await stockEntriesAPI.acknowledgeReturn(id, payload);
      
      setSuccess('Return acknowledged successfully!');
      setTimeout(() => navigate('/dashboard/returns'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to acknowledge return');
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

  if (error && !returnEntry) {
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
          onClick={() => navigate('/dashboard/returns')}
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
          onClick={() => navigate('/dashboard/returns')}
          className="flex items-center text-xs text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to Returns
        </button>
        <h1 className="text-sm font-bold text-gray-900">Acknowledge Return Receipt</h1>
        <p className="text-xs text-gray-600 mt-0.5">
          Confirm receipt of returned/rejected items
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

      {/* Return Entry Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Return Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Return Entry Number</p>
              <p className="text-xs font-medium text-gray-900">{returnEntry?.entry_number}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Item</p>
              <p className="text-xs font-medium text-gray-900">{returnEntry?.item_name}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {returnEntry?.item_tracking_type_display}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Returned From</p>
              <p className="text-xs font-medium text-gray-900">{returnEntry?.from_location_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Returning To</p>
              <p className="text-xs font-medium text-gray-900">{returnEntry?.to_location_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Created By</p>
              <p className="text-xs font-medium text-gray-900">{returnEntry?.created_by_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Return Date</p>
              <p className="text-xs font-medium text-gray-900">
                {new Date(returnEntry?.entry_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {returnEntry?.remarks && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Rejection/Return Reason</p>
            <p className="text-xs text-gray-900">{returnEntry.remarks}</p>
          </div>
        )}
      </div>

      {/* Items Being Returned */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">
          Items Being Returned ({trackingType === 'INDIVIDUAL' ? instances.length : returnEntry?.quantity})
        </h2>

        {trackingType === 'INDIVIDUAL' ? (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {instances.map((instance) => (
              <div key={instance.id} className="border border-gray-200 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-900">
                  {instance.instance_code}
                </p>
                {instance.serial_number && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    Serial: {instance.serial_number}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Quantity</p>
                <p className="text-base font-bold text-gray-900">{returnEntry?.quantity} units</p>
              </div>
              <RotateCcw className="w-8 h-8 text-gray-300" />
            </div>
          </div>
        )}
      </div>

      {/* Acknowledgment Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">Acknowledgment</h2>
          <p className="text-xs text-gray-600">
            By acknowledging this return, you confirm that all {trackingType === 'INDIVIDUAL' ? 'items' : 'units'} have been received back at {returnEntry?.to_location_name}.
          </p>
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> A receipt entry will be automatically created and inventory will be updated.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/returns')}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                Processing...
              </>
            ) : (
              <>
                <Save className="w-3 h-3 mr-1" />
                Confirm Receipt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReturnAcknowledgmentForm;