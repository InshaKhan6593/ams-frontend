// src/pages/StockEntries/StockEntriesList.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Package, ArrowRight, Clock, CheckCircle, XCircle, Eye, Loader, Download } from 'lucide-react';
import { stockEntriesAPI } from '../../api/stockEntries';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const StockEntriesList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [stockEntries, setStockEntries] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    entry_type: '',
    status: '',
    search: '',
  });

  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    fetchStockEntries(true);
  }, [filters.entry_type, filters.status, debouncedSearch]);

  const fetchStockEntries = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = { page: reset ? 1 : getPageNumber(nextPage) };
      if (filters.entry_type) params.entry_type = filters.entry_type;
      if (filters.status) params.status = filters.status;
      if (debouncedSearch) params.search = debouncedSearch;

      const data = await stockEntriesAPI.getAll(params);

      if (reset) {
        setStockEntries(data.results || []);
      } else {
        setStockEntries(prev => [...prev, ...(data.results || [])]);
      }

      setNextPage(data.next || null);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error('Failed to load stock entries:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getPageNumber = (url) => {
    if (!url) return 1;
    const match = url.match(/[?&]page=(\d+)/);
    return match ? parseInt(match[1]) : 1;
  };

  const handleLoadMore = () => {
    if (nextPage && !loadingMore) {
      fetchStockEntries(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true);
      // Pass current filters to export only filtered data
      const params = {};
      if (filters.entry_type) params.entry_type = filters.entry_type;
      if (filters.status) params.status = filters.status;
      if (debouncedSearch) params.search = debouncedSearch;

      await stockEntriesAPI.exportCSV(params);
    } catch (err) {
      console.error('Failed to download CSV:', err);
      alert('Failed to download CSV file');
    } finally {
      setDownloading(false);
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
      TRANSFER: 'bg-indigo-100 text-indigo-700',
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
          <p className="text-xs text-gray-600 mt-0.5">
            Manage item transfers and movements ({totalCount} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            disabled={downloading || totalCount === 0}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <Loader className="h-3.5 w-3.5 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/dashboard/stock-entries/new')}
            className="flex items-center gap-0.5 px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New Stock Entry
          </button>
        </div>
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
              placeholder="Entry number, item..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              <Filter className="inline h-3 w-3 mr-1" />
              Entry Type
            </label>
            <select
              value={filters.entry_type}
              onChange={(e) => setFilters({ ...filters, entry_type: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="ISSUE">Issue</option>
              <option value="RECEIPT">Receipt</option>
              <option value="RETURN">Return</option>
              <option value="TRANSFER">Transfer</option>
              <option value="CORRECTION">Correction</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_ACK">Pending Acknowledgment</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Results counter */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Showing {stockEntries.length} of {totalCount} entries
          </p>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-1.5">
        {stockEntries.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <Package className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No stock entries found</h3>
            <p className="text-xs text-gray-600">
              {filters.search || filters.entry_type || filters.status
                ? 'Try adjusting your filters'
                : 'Create your first stock entry to get started'}
            </p>
          </div>
        ) : (
          <>
            {stockEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => navigate(`/dashboard/stock-entries/${entry.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-2 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="text-xs font-semibold text-gray-900">
                        {entry.entry_number}
                      </h3>
                      {getEntryTypeBadge(entry.entry_type)}
                      {getStatusBadge(entry.status)}
                      {entry.item_tracking_type_display && (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          entry.item_tracking_type === 'INDIVIDUAL' ? 'bg-purple-100 text-purple-700' :
                          entry.item_tracking_type === 'BATCH' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {entry.item_tracking_type_display}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-xs">
                      <div>
                        <span className="text-gray-600">Item:</span>
                        <span className="ml-1 font-medium text-gray-900">{entry.item_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <span className="ml-1 font-medium text-gray-900">{entry.quantity}</span>
                      </div>
                      {entry.from_location_name && (
                        <div>
                          <span className="text-gray-600">From:</span>
                          <span className="ml-1 font-medium text-gray-900">{entry.from_location_name}</span>
                        </div>
                      )}
                      {entry.to_location_name && (
                        <div>
                          <span className="text-gray-600">To:</span>
                          <span className="ml-1 font-medium text-gray-900">{entry.to_location_name}</span>
                        </div>
                      )}
                    </div>

                    {entry.purpose && (
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{entry.purpose}</p>
                    )}
                  </div>

                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {nextPage && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-primary-600 bg-white border border-primary-600 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <span className="text-gray-500">
                        ({totalCount - stockEntries.length} remaining)
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StockEntriesList;
