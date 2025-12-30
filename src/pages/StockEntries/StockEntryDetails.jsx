// src/pages/StockEntries/StockEntryDetails.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Package, MapPin, Calendar, User, FileText, 
  Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { stockEntriesAPI } from '../../api/stockEntries';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StockEntryDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEntry();
  }, [id]);

  const fetchEntry = async () => {
    try {
      setLoading(true);
      const data = await stockEntriesAPI.get(id);
      setEntry(data);
    } catch (err) {
      setError('Failed to load stock entry');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
      PENDING_ACK: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    };
    const badge = badges[status] || badges.DRAFT;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getEntryTypeBadge = (type) => {
    const badges = {
      ISSUE: 'bg-blue-100 text-blue-700',
      RECEIPT: 'bg-green-100 text-green-700',
      RETURN: 'bg-purple-100 text-purple-700',
      CORRECTION: 'bg-orange-100 text-orange-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badges[type] || 'bg-gray-100 text-gray-700'}`}>
        {type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (error || !entry) {
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
          onClick={() => navigate('/dashboard/stock-entries')}
          className="mt-3 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/dashboard/stock-entries')}
          className="flex items-center text-xs text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to Stock Entries
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-900">{entry.entry_number}</h1>
            <p className="text-xs text-gray-600 mt-0.5">Stock Entry Details</p>
          </div>
          <div className="flex items-center gap-2">
            {getEntryTypeBadge(entry.entry_type)}
            {getStatusBadge(entry.status)}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
        <h2 className="text-xs font-semibold text-gray-900 mb-3">Entry Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Entry Number</p>
              <p className="text-xs font-medium text-gray-900">{entry.entry_number}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Entry Date</p>
              <p className="text-xs font-medium text-gray-900">
                {new Date(entry.entry_date).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Item</p>
              <p className="text-xs font-medium text-gray-900">{entry.item_name}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Tracking: {entry.item_tracking_type_display || entry.item_tracking_type || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Quantity</p>
              <p className="text-xs font-medium text-gray-900">
                {entry.item_tracking_type === 'INDIVIDUAL' 
                  ? `${entry.instances_count} items`
                  : `${entry.quantity} units`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
        <h2 className="text-xs font-semibold text-gray-900 mb-3">Location Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entry.from_location_name && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600">From Location</p>
                <p className="text-xs font-medium text-gray-900">{entry.from_location_name}</p>
              </div>
            </div>
          )}

          {entry.to_location_name && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600">To Location</p>
                <p className="text-xs font-medium text-gray-900">{entry.to_location_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
        <h2 className="text-xs font-semibold text-gray-900 mb-3">User Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Created By</p>
              <p className="text-xs font-medium text-gray-900">{entry.created_by_name || 'N/A'}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {entry.acknowledged_by_name && (
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600">Acknowledged By</p>
                <p className="text-xs font-medium text-gray-900">{entry.acknowledged_by_name}</p>
                {entry.acknowledged_at && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(entry.acknowledged_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Items Details */}
      {entry.item_tracking_type === 'INDIVIDUAL' && entry.instances_details?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-3">
            Items ({entry.instances_details.length})
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {entry.instances_details.map((instance) => (
              <div key={instance.id} className="border border-gray-200 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-900">{instance.instance_code}</p>
                {instance.serial_number && (
                  <p className="text-xs text-gray-600 mt-0.5">Serial: {instance.serial_number}</p>
                )}
                <p className="text-xs text-gray-600 mt-0.5">Status: {instance.status_display}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Details */}
      {(entry.item_tracking_type === 'BATCH' || entry.item_tracking_type === 'BULK') && 
       entry.batch_allocations_details?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-3">
            Batch Allocations ({entry.batch_allocations_details.length})
          </h2>
          <div className="space-y-2">
            {entry.batch_allocations_details.map((batch, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      Batch: {batch.batch_number}
                    </p>
                    {batch.expiry_date && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        Expires: {new Date(batch.expiry_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-900">
                      Qty: {batch.quantity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Information */}
      {(entry.purpose || entry.remarks) && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-3">Additional Information</h2>
          {entry.purpose && (
            <div className="mb-2">
              <p className="text-xs text-gray-600">Purpose</p>
              <p className="text-xs text-gray-900">{entry.purpose}</p>
            </div>
          )}
          {entry.remarks && (
            <div>
              <p className="text-xs text-gray-600">Remarks</p>
              <p className="text-xs text-gray-900">{entry.remarks}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockEntryDetails;