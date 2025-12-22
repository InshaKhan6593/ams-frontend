// src/pages/InterStoreRequests/RequestsList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Package, MapPin, Clock, CheckCircle, XCircle, 
  AlertCircle, ArrowRight, ArrowUp, Loader, Eye 
} from 'lucide-react';
import { interStoreRequestsAPI } from '../../api/interStoreRequests';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RequestsList = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('outgoing'); // outgoing, incoming, all
  
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [outgoing, incoming, all] = await Promise.all([
        interStoreRequestsAPI.getOutgoing(),
        interStoreRequestsAPI.getIncoming(),
        interStoreRequestsAPI.getAll()
      ]);
      
      setOutgoingRequests(outgoing);
      setIncomingRequests(incoming);
      setAllRequests(all);
      
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      DRAFT: { color: 'gray', icon: Clock, text: 'Draft' },
      PENDING: { color: 'yellow', icon: Clock, text: 'Pending' },
      PROCESSING: { color: 'blue', icon: Loader, text: 'Processing' },
      PARTIALLY_DISPATCHED: { color: 'indigo', icon: ArrowRight, text: 'Partial' },
      DISPATCHED: { color: 'purple', icon: ArrowRight, text: 'Dispatched' },
      ACKNOWLEDGED: { color: 'green', icon: CheckCircle, text: 'Completed' },
      REJECTED: { color: 'red', icon: XCircle, text: 'Rejected' },
      CANCELLED: { color: 'gray', icon: XCircle, text: 'Cancelled' },
    };

    const config = configs[status] || configs.DRAFT;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-${config.color}-100 text-${config.color}-700`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const configs = {
      LOW: { color: 'gray', text: 'Low' },
      NORMAL: { color: 'blue', text: 'Normal' },
      HIGH: { color: 'orange', text: 'High' },
      URGENT: { color: 'red', text: 'Urgent' },
    };

    const config = configs[priority] || configs.NORMAL;

    return (
      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-${config.color}-100 text-${config.color}-700`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderRequestCard = (request, isIncoming = false) => {
    return (
      <div 
        key={request.id}
        className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/dashboard/store-requests/${request.id}`)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xs font-bold text-gray-900">{request.request_number}</h3>
              {getStatusBadge(request.status)}
              {getPriorityBadge(request.priority)}
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">{request.purpose}</p>
          </div>
        </div>

        {/* Transfer Info */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-blue-50 rounded p-1.5">
            <p className="text-xs text-blue-600 font-medium mb-0.5">From</p>
            <p className="text-xs text-blue-900 font-semibold">
              {request.requesting_store_name}
            </p>
            <p className="text-xs text-blue-700">{request.requesting_store_code}</p>
          </div>
          <div className="bg-green-50 rounded p-1.5">
            <p className="text-xs text-green-600 font-medium mb-0.5">To</p>
            <p className="text-xs text-green-900 font-semibold">
              {request.fulfilling_store_name}
            </p>
            <p className="text-xs text-green-700">{request.fulfilling_store_code}</p>
          </div>
        </div>

        {/* Items Summary */}
        <div className="flex items-center gap-3 mb-2 text-xs">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">
              {request.total_items_requested} item{request.total_items_requested !== 1 ? 's' : ''}
            </span>
          </div>
          {request.total_items_fulfilled > 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>{request.total_items_fulfilled} fulfilled</span>
            </div>
          )}
          {request.total_items_na > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>{request.total_items_na} N/A</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{formatDate(request.requested_at)}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/store-requests/${request.id}`);
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded"
          >
            <Eye className="h-3 w-3" />
            View
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const currentRequests = 
    activeTab === 'outgoing' ? outgoingRequests :
    activeTab === 'incoming' ? incomingRequests :
    allRequests;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-900">Inter-Store Requests</h1>
          <p className="text-xs text-gray-600 mt-0">
            Request and manage item transfers between stores
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/store-requests/new')}
          className="flex items-center gap-1 px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-3 w-3" />
          New Request
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1 flex gap-1">
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded ${
            activeTab === 'outgoing'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <ArrowUp className="h-3 w-3" />
            Outgoing ({outgoingRequests.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded ${
            activeTab === 'incoming'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <ArrowRight className="h-3 w-3" />
            Incoming ({incomingRequests.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded ${
            activeTab === 'all'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All ({allRequests.length})
        </button>
      </div>

      {/* Requests List */}
      {currentRequests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <h3 className="text-xs font-semibold text-gray-900 mb-1">No requests found</h3>
          <p className="text-xs text-gray-600 mb-3">
            {activeTab === 'outgoing' && 'Create a new request to get started'}
            {activeTab === 'incoming' && 'No incoming requests to process'}
            {activeTab === 'all' && 'No requests available'}
          </p>
          {activeTab === 'outgoing' && (
            <button
              onClick={() => navigate('/dashboard/store-requests/new')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-3 w-3" />
              Create First Request
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {currentRequests.map(request => 
            renderRequestCard(request, activeTab === 'incoming')
          )}
        </div>
      )}
    </div>
  );
};

export default RequestsList;