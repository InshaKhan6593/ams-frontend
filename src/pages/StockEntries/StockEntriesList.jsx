// src/pages/StockEntries/StockEntriesList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Package, ArrowRight, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { stockEntriesAPI } from '../../api/stockEntries';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StockEntriesList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stockEntries, setStockEntries] = useState([]);
  const [filters, setFilters] = useState({
    entry_type: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    fetchStockEntries();
  }, [filters]);

  const fetchStockEntries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.entry_type) params.entry_type = filters.entry_type;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      // Use getAll to fetch all stock entries (backend filters by accessible stores)
      const data = await stockEntriesAPI.getAll(params);
      setStockEntries(data.results || data);
    } catch (err) {
      console.error('Failed to load stock entries:', err);
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
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
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
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${badges[type] || 'bg-gray-100 text-gray-700'}`}>
        {type}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-900">Stock Entries</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage item transfers and movements</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/stock-entries/new')}
          className="flex items-center gap-0.5 px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-3.5 w-3.5" />
          New Stock Entry
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              <Search className="inline h-3 w-3 mr-1" />
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Entry number, item name..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              <Filter className="inline h-3 w-3 mr-1" />
              Entry Type
            </label>
            <select
              value={filters.entry_type}
              onChange={(e) => setFilters(prev => ({ ...prev, entry_type: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="ISSUE">Issue</option>
              <option value="RECEIPT">Receipt</option>
              <option value="RETURN">Return</option>
              <option value="CORRECTION">Correction</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_ACK">Pending Acknowledgment</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock Entries List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {stockEntries.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-600">No stock entries found</p>
            <button
              onClick={() => navigate('/dashboard/stock-entries/new')}
              className="mt-2 text-primary-600 hover:text-primary-700 text-xs font-medium"
            >
              Create your first stock entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                    Entry #
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                    Type
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                    Transfer
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                    Item
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                    Quantity
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                    Date
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1">
                      <div className="text-xs font-medium text-gray-900">{entry.entry_number}</div>
                      {entry.is_temporary && (
                        <span className="text-xs text-yellow-600">Temporary</span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      {getEntryTypeBadge(entry.entry_type)}
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-900">{entry.from_location?.name || '-'}</span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-900">{entry.to_location?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="text-xs text-gray-900">{entry.item?.name}</div>
                      <div className="text-xs text-gray-500">{entry.item?.code}</div>
                    </td>
                    <td className="px-2 py-1 text-xs text-gray-900">
                      {entry.quantity}
                    </td>
                    <td className="px-2 py-1 text-xs text-gray-600">
                      {new Date(entry.entry_date).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-1">
                      {getStatusBadge(entry.status)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      <button
                        onClick={() => navigate(`/dashboard/stock-entries/${entry.id}`)}
                        className="inline-flex items-center gap-0.5 text-primary-600 hover:text-primary-700 text-xs font-medium"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockEntriesList;