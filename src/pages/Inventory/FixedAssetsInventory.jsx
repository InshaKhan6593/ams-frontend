// src/pages/Inventory/FixedAssetsInventory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Package, MapPin, Eye, AlertCircle } from 'lucide-react';
import { fixedAssetsAPI } from '../../api/inventory';
import { locationsAPI } from '../../api/locations';
import { usePermissions } from '../../hooks/usePermissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const FixedAssetsInventory = () => {
  const navigate = useNavigate();
  const { isLocationHead, isStockIncharge, isSystemAdmin } = usePermissions();
  const [inventoryData, setInventoryData] = useState({ items: [], accessible_stores: [] });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [locationFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (locationFilter) params.location = locationFilter;
      if (searchTerm) params.search = searchTerm;

      const [aggregatedData, locationsData] = await Promise.all([
        fixedAssetsAPI.getAggregated(params),
        locationsAPI.getUserAccessibleLocations()
      ]);

      setInventoryData(aggregatedData);
      setLocations(Array.isArray(locationsData) ? locationsData : locationsData.results || []);
    } catch (err) {
      console.error('Error fetching fixed assets:', err);
      setError('Failed to load fixed assets data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const viewDistribution = (itemId) => {
    navigate(`/dashboard/inventory/fixed-assets/${itemId}/distribution`);
  };

  const filteredItems = (inventoryData.items || []).filter((item) => {
    const matchesSearch =
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate totals
  const totals = filteredItems.reduce((acc, item) => ({
    total: acc.total + item.total_count,
    inStore: acc.inStore + item.in_store,
    inUse: acc.inUse + item.in_use,
    inTransit: acc.inTransit + item.in_transit,
    underRepair: acc.underRepair + item.under_repair,
    damaged: acc.damaged + item.damaged,
  }), { total: 0, inStore: 0, inUse: 0, inTransit: 0, underRepair: 0, damaged: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-900">{totals.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">In Store</p>
          <p className="text-lg font-bold text-green-600">{totals.inStore}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">In Use</p>
          <p className="text-lg font-bold text-slate-600">{totals.inUse}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">In Transit</p>
          <p className="text-lg font-bold text-slate-500">{totals.inTransit}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Under Repair</p>
          <p className="text-lg font-bold text-amber-600">{totals.underRepair}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Damaged</p>
          <p className="text-lg font-bold text-red-600">{totals.damaged}</p>
        </div>
      </div>

      {/* Role-based Info Banner */}
      {(isLocationHead() || isSystemAdmin()) && !locationFilter && (
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-700">
            Viewing inventory across <strong>{inventoryData.accessible_stores?.length || 0}</strong> stores.
            Click "View" to see store distribution for each item.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by item name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Stores</option>
            {locations.filter(l => l.is_store).map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchData}
            className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </form>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Item</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Category</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Total</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">In Store</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">In Use</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">In Transit</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Issues</th>
                {(isLocationHead() || isSystemAdmin()) && (
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Stores</th>
                )}
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={(isLocationHead() || isSystemAdmin()) ? 9 : 8} className="px-3 py-8 text-center text-xs text-gray-500">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No fixed assets found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const hasIssues = item.under_repair > 0 || item.damaged > 0;
                  return (
                    <tr key={item.item_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-900">{item.item_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{item.item_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs text-gray-600">{item.category_name || '-'}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-xs font-bold text-gray-900">{item.total_count}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-xs text-green-600 font-medium">{item.in_store}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-xs text-slate-600 font-medium">{item.in_use}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-xs text-slate-500 font-medium">{item.in_transit}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {hasIssues ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded">
                            {item.under_repair + item.damaged}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      {(isLocationHead() || isSystemAdmin()) && (
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {item.store_count}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => viewDistribution(item.item_id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      {filteredItems.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 px-1">
          <span>
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} with {totals.total} instance{totals.total !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default FixedAssetsInventory;
