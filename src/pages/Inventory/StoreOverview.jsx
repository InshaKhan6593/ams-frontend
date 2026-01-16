// src/pages/Inventory/StoreOverview.jsx
// Overview inventory view for Location Head/Admin - aggregated view across all stores
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  Layers,
  Calendar,
  Store,
  RefreshCw,
  AlertCircle,
  Eye,
  MapPin,
  Building2,
  Search,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { fixedAssetsAPI, consumablesAPI, perishablesAPI } from '../../api/inventory';
import { locationsAPI } from '../../api/locations';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StoreOverview = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fixed-assets');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Inventory data for each type
  const [fixedAssetsData, setFixedAssetsData] = useState({ items: [], accessible_stores: [] });
  const [consumablesData, setConsumablesData] = useState({ items: [], accessible_stores: [] });
  const [perishablesData, setPerishablesData] = useState({ items: [], accessible_stores: [] });
  const [tabLoading, setTabLoading] = useState(false);

  // Initial load - get accessible stores
  useEffect(() => {
    const initializeStores = async () => {
      try {
        setLoading(true);
        const response = await locationsAPI.getUserAccessibleLocations();

        // API returns: { user_role, responsible_location, locations, count }
        const locationsList = response.locations || [];
        const storesList = locationsList.filter((l) => l.is_store);
        setStores(storesList);
      } catch (err) {
        console.error('Error initializing stores:', err);
        setError('Failed to load store information');
      } finally {
        setLoading(false);
      }
    };
    initializeStores();
  }, []);

  // Fetch inventory data when stores loaded or tab/filter changes
  useEffect(() => {
    if (!loading) {
      fetchInventoryData();
    }
  }, [stores, activeTab, selectedStore, loading]);

  const fetchInventoryData = async () => {
    try {
      setTabLoading(true);
      setError('');

      const params = {};
      if (selectedStore) params.location = selectedStore;

      if (activeTab === 'fixed-assets') {
        const data = await fixedAssetsAPI.getAggregated(params);
        setFixedAssetsData(data);
      } else if (activeTab === 'consumables') {
        const data = await consumablesAPI.getAggregated(params);
        setConsumablesData(data);
      } else if (activeTab === 'perishables') {
        const data = await perishablesAPI.getAggregated(params);
        setPerishablesData(data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory data');
    } finally {
      setTabLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInventoryData();
  };

  const viewDistribution = (itemId) => {
    const routes = {
      'fixed-assets': `/dashboard/inventory/fixed-assets/${itemId}/distribution`,
      consumables: `/dashboard/inventory/consumables/${itemId}/distribution`,
      perishables: `/dashboard/inventory/perishables/${itemId}/distribution`,
    };
    navigate(routes[activeTab]);
  };

  // Calculate totals for fixed assets
  const fixedAssetsTotals = (fixedAssetsData.items || []).reduce(
    (acc, item) => ({
      total: acc.total + item.total_count,
      inStore: acc.inStore + item.in_store,
      inUse: acc.inUse + item.in_use,
      inTransit: acc.inTransit + item.in_transit,
      underRepair: acc.underRepair + item.under_repair,
      damaged: acc.damaged + item.damaged,
    }),
    { total: 0, inStore: 0, inUse: 0, inTransit: 0, underRepair: 0, damaged: 0 }
  );

  // Calculate totals for consumables
  const consumablesTotals = (consumablesData.items || []).reduce(
    (acc, item) => ({
      totalQty: acc.totalQty + item.total_quantity,
      available: acc.available + item.available_quantity,
      reserved: acc.reserved + item.reserved_quantity,
      inTransit: acc.inTransit + (item.in_transit_quantity || 0),
      inUse: acc.inUse + (item.in_use_quantity || 0),
      lowStock: acc.lowStock + (item.is_low_stock ? 1 : 0),
      outOfStock: acc.outOfStock + (item.available_quantity === 0 ? 1 : 0),
    }),
    { totalQty: 0, available: 0, reserved: 0, inTransit: 0, inUse: 0, lowStock: 0, outOfStock: 0 }
  );

  // Calculate totals for perishables
  const perishablesTotals = (perishablesData.items || []).reduce(
    (acc, item) => ({
      totalQty: acc.totalQty + item.total_quantity,
      available: acc.available + item.available_quantity,
      inTransit: acc.inTransit + (item.in_transit_quantity || 0),
      inUse: acc.inUse + (item.in_use_quantity || 0),
      batches: acc.batches + item.batch_count,
      expired: acc.expired + item.expired_batches,
      nearExpiry: acc.nearExpiry + item.near_expiry_batches,
      fresh: acc.fresh + item.fresh_batches,
    }),
    { totalQty: 0, available: 0, inTransit: 0, inUse: 0, batches: 0, expired: 0, nearExpiry: 0, fresh: 0 }
  );

  // Filter items by search term
  const filterItems = (items) => {
    if (!searchTerm) return items;
    return items.filter(
      (item) =>
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const tabs = [
    {
      id: 'fixed-assets',
      name: 'Fixed Assets',
      icon: Package,
      description: 'Individual tracking - Equipment',
    },
    {
      id: 'consumables',
      name: 'Consumables',
      icon: Layers,
      description: 'Bulk tracking - Supplies',
    },
    {
      id: 'perishables',
      name: 'Perishables',
      icon: Calendar,
      description: 'Batch tracking - Expirables',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Overview Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-xs font-medium text-gray-900">Inventory Overview</span>
              <p className="text-[10px] text-gray-500">
                {selectedStore
                  ? stores.find((s) => s.id.toString() === selectedStore)?.name
                  : `Across ${stores.length} stores`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
            <Link
              to="/dashboard/inventory/all-stores"
              className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <Building2 className="w-3 h-3" />
              All Stores
            </Link>
            <Link
              to="/dashboard/inventory/non-stores"
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MapPin className="w-3 h-3" />
              Non-Stores
            </Link>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Stores</p>
          <p className="text-lg font-bold text-gray-900">{stores.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Fixed Assets</p>
          <p className="text-lg font-bold text-green-600">{fixedAssetsTotals.inStore}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Consumables</p>
          <p className="text-lg font-bold text-blue-600">{consumablesTotals.available}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Attention</p>
          <p className="text-lg font-bold text-amber-600">
            {fixedAssetsTotals.underRepair + fixedAssetsTotals.damaged + consumablesTotals.lowStock + perishablesTotals.expired}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{tab.name}</p>
                  <p className="text-[10px] text-gray-500 truncate hidden sm:block">
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Banner */}
      {!selectedStore && (
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-700">
            Viewing inventory across <strong>{stores.length}</strong> stores. Select a
            specific store to filter, or click "View" to see distribution for each item.
          </p>
        </div>
      )}

      {/* Tab Content */}
      {tabLoading ? (
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Fixed Assets Tab */}
          {activeTab === 'fixed-assets' && (
            <FixedAssetsTable
              items={filterItems(fixedAssetsData.items || [])}
              totals={fixedAssetsTotals}
              onView={viewDistribution}
              showStores={!selectedStore}
            />
          )}

          {/* Consumables Tab */}
          {activeTab === 'consumables' && (
            <ConsumablesTable
              items={filterItems(consumablesData.items || [])}
              totals={consumablesTotals}
              onView={viewDistribution}
              showStores={!selectedStore}
            />
          )}

          {/* Perishables Tab */}
          {activeTab === 'perishables' && (
            <PerishablesTable
              items={filterItems(perishablesData.items || [])}
              totals={perishablesTotals}
              onView={viewDistribution}
              showStores={!selectedStore}
            />
          )}
        </>
      )}
    </div>
  );
};

// Fixed Assets Table Component
const FixedAssetsTable = ({ items, totals, onView, showStores }) => {
  return (
    <div className="space-y-2">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
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
          <p className="text-lg font-bold text-blue-600">{totals.inTransit}</p>
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
                {showStores && (
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Stores</th>
                )}
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={showStores ? 9 : 8} className="px-3 py-8 text-center text-xs text-gray-500">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No fixed assets found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
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
                        <span className="text-xs text-blue-600 font-medium">{item.in_transit}</span>
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
                      {showStores && (
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {item.store_count}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => onView(item.item_id)}
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
      {items.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 px-1">
          <span>
            {items.length} item{items.length !== 1 ? 's' : ''} with {totals.total} instance
            {totals.total !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

// Consumables Table Component
const ConsumablesTable = ({ items, totals, onView, showStores }) => {
  return (
    <div className="space-y-2">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Items</p>
          <p className="text-lg font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Total Qty</p>
          <p className="text-lg font-bold text-gray-900">{totals.totalQty}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-lg font-bold text-green-600">{totals.available}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Reserved</p>
          <p className="text-lg font-bold text-amber-600">{totals.reserved || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">In Transit</p>
          <p className="text-lg font-bold text-blue-600">{totals.inTransit || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">In Use</p>
          <p className="text-lg font-bold text-slate-600">{totals.inUse || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Low Stock</p>
          <p className="text-lg font-bold text-red-600">{totals.lowStock}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Item</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Category</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Total Qty</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Available</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Reserved</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">In Transit</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">In Use</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Status</th>
                {showStores && (
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Stores</th>
                )}
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={showStores ? 10 : 9} className="px-3 py-8 text-center text-xs text-gray-500">
                    <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No consumables found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLowStock = item.is_low_stock;
                  const isOutOfStock = item.available_quantity === 0;
                  return (
                    <tr key={item.item_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
                        <span className="text-xs font-bold text-gray-900">
                          {item.total_quantity}{' '}
                          <span className="font-normal text-gray-500">{item.item_unit}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-medium ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                          {item.available_quantity}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs ${item.reserved_quantity > 0 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                          {item.reserved_quantity || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs ${item.in_transit_quantity > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                          {item.in_transit_quantity || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-xs ${item.in_use_quantity > 0 ? 'text-slate-600 font-medium' : 'text-gray-400'}`}>
                            {item.in_use_quantity || '-'}
                          </span>
                          {item.in_use_quantity > 0 && (
                            <button
                              onClick={() => navigate(`/dashboard/inventory/in-use/${item.id}`)}
                              className="text-primary-600 hover:text-primary-700 transition-colors"
                              title="View in-use locations"
                            >
                              <MapPin className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded">
                            In Stock
                          </span>
                        )}
                      </td>
                      {showStores && (
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {item.store_count}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => onView(item.item_id)}
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
      {items.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 px-1">
          <span>
            {items.length} item{items.length !== 1 ? 's' : ''} with {totals.totalQty} total units
          </span>
        </div>
      )}
    </div>
  );
};

// Perishables Table Component
const PerishablesTable = ({ items, totals, onView, showStores }) => {
  return (
    <div className="space-y-2">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Items</p>
          <p className="text-lg font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Total Qty</p>
          <p className="text-lg font-bold text-gray-900">{totals.totalQty}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-lg font-bold text-green-600">{totals.available}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">In Transit</p>
          <p className="text-lg font-bold text-blue-600">{totals.inTransit || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">In Use</p>
          <p className="text-lg font-bold text-slate-600">{totals.inUse || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Batches</p>
          <p className="text-lg font-bold text-slate-600">{totals.batches}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Near Expiry</p>
          <p className="text-lg font-bold text-amber-600">{totals.nearExpiry}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <p className="text-xs text-gray-500">Expired</p>
          <p className="text-lg font-bold text-red-600">{totals.expired}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Item</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Category</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Total Qty</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Available</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">In Transit</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">In Use</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Batches</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Status</th>
                {showStores && (
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Stores</th>
                )}
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={showStores ? 10 : 9} className="px-3 py-8 text-center text-xs text-gray-500">
                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No perishables found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const hasExpired = item.expired_batches > 0;
                  const hasNearExpiry = item.near_expiry_batches > 0;
                  return (
                    <tr key={item.item_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
                        <span className="text-xs font-bold text-gray-900">
                          {item.total_quantity}{' '}
                          <span className="font-normal text-gray-500">{item.item_unit}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-medium ${item.available_quantity === 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {item.available_quantity}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs ${item.in_transit_quantity > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                          {item.in_transit_quantity || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-xs ${item.in_use_quantity > 0 ? 'text-slate-600 font-medium' : 'text-gray-400'}`}>
                            {item.in_use_quantity || '-'}
                          </span>
                          {item.in_use_quantity > 0 && (
                            <button
                              onClick={() => navigate(`/dashboard/inventory/in-use/${item.id}`)}
                              className="text-primary-600 hover:text-primary-700 transition-colors"
                              title="View in-use locations"
                            >
                              <MapPin className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs font-medium text-gray-700">{item.batch_count}</span>
                          {item.fresh_batches > 0 && (
                            <span className="inline-flex items-center px-1 py-0.5 text-xs bg-green-50 text-green-700 rounded" title="Fresh">
                              {item.fresh_batches}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {hasExpired ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded">
                            <Calendar className="w-3 h-3" />
                            {item.expired_batches} expired
                          </span>
                        ) : hasNearExpiry ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            {item.near_expiry_batches} expiring
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded">
                            Fresh
                          </span>
                        )}
                      </td>
                      {showStores && (
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {item.store_count}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => onView(item.item_id)}
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
      {items.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 px-1">
          <span>
            {items.length} item{items.length !== 1 ? 's' : ''} with {totals.batches} batches
          </span>
        </div>
      )}
    </div>
  );
};

export default StoreOverview;
