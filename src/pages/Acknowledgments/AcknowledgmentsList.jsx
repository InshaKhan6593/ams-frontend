// src/pages/Acknowledgments/AcknowledgmentsList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, Clock, Package, MapPin, Filter, Search,
  ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { stockEntriesAPI } from '../../api/stockEntries';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AcknowledgmentsList = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTracking, setFilterTracking] = useState('');

  useEffect(() => {
    fetchPendingAcknowledgments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, searchTerm, filterTracking]);

  const fetchPendingAcknowledgments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await stockEntriesAPI.getAll({
        pending_ack: 'true',
        status: 'PENDING_ACK'
      });
      const allEntries = data.results || data;
      // Filter to only show entries the user can actually acknowledge
      const acknowledgeableEntries = allEntries.filter(entry => entry.can_acknowledge);
      setEntries(acknowledgeableEntries);
    } catch (err) {
      setError('Failed to load acknowledgments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...entries];

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.entry_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.from_location_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterTracking) {
      filtered = filtered.filter(entry => 
        entry.item_tracking_type === filterTracking
      );
    }

    setFilteredEntries(filtered);
  };

  const getTrackingBadge = (trackingType) => {
    const badges = {
      'INDIVIDUAL': 'bg-purple-100 text-purple-700',
      'BATCH': 'bg-blue-100 text-blue-700',
      'BULK': 'bg-green-100 text-green-700'
    };
    return badges[trackingType] || 'bg-gray-100 text-gray-700';
  };

  const getDaysWaiting = (entryDate) => {
    const days = Math.floor((new Date() - new Date(entryDate)) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading acknowledgments..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-sm font-bold text-gray-900">Pending Acknowledgments</h1>
        <p className="text-xs text-gray-600 mt-0.5">
          Review and acknowledge received items
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-red-800">Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Pending</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {entries.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Fixed Assets</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {entries.filter(e => e.item_tracking_type === 'INDIVIDUAL').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Consumables</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {entries.filter(e => e.item_tracking_type !== 'INDIVIDUAL').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by entry number, item, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={filterTracking}
              onChange={(e) => setFilterTracking(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="INDIVIDUAL">Fixed Assets</option>
              <option value="BATCH">Batch (FIFO)</option>
              <option value="BULK">Bulk</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Showing {filteredEntries.length} of {entries.length} entries
          </p>
          <button
            onClick={fetchPendingAcknowledgments}
            className="flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-xs font-semibold text-gray-900 mb-1">
            No pending acknowledgments
          </h3>
          <p className="text-xs text-gray-600">
            All items have been acknowledged
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => navigate(`/dashboard/acknowledgments/${entry.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xs font-semibold text-gray-900">
                      {entry.entry_number}
                    </h3>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${getTrackingBadge(entry.item_tracking_type)}`}>
                      {entry.item_tracking_type_display}
                    </span>
                    <span className="flex items-center text-xs text-gray-600">
                      <Clock className="w-3 h-3 mr-1" />
                      {getDaysWaiting(entry.entry_date)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                    <div className="flex items-start gap-2">
                      <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600">Item</p>
                        <p className="text-xs font-medium text-gray-900">{entry.item_name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600">From</p>
                        <p className="text-xs font-medium text-gray-900">
                          {entry.from_location_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
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

                  {entry.purpose && (
                    <p className="text-xs text-gray-600 line-clamp-1">
                      {entry.purpose}
                    </p>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-3" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcknowledgmentsList;