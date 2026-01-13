// src/pages/Inventory/AllStoresPage.jsx
// Detailed store-by-store inventory view - accessible to all roles
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Layers,
  Calendar,
  Store,
  RefreshCw,
  AlertCircle,
  Eye,
  MapPin,
  ChevronDown,
  ChevronUp,
  Search,
  AlertTriangle,
  Building2,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { fixedAssetsAPI, consumablesAPI, perishablesAPI } from '../../api/inventory';
import { locationsAPI } from '../../api/locations';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AllStoresPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fixed-assets');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Store inventory data
  const [storeInventories, setStoreInventories] = useState({});
  const [loadingStore, setLoadingStore] = useState(null);
  const [expandedStores, setExpandedStores] = useState({});

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

        // Expand first store by default
        if (storesList.length > 0) {
          setExpandedStores({ [storesList[0].id]: true });
          await fetchStoreInventory(storesList[0].id);
        }
      } catch (err) {
        console.error('Error initializing stores:', err);
        setError('Failed to load store information');
      } finally {
        setLoading(false);
      }
    };
    initializeStores();
  }, []);

  const fetchStoreInventory = async (storeId) => {
    // Skip if already loaded
    if (storeInventories[storeId]) return;

    try {
      setLoadingStore(storeId);
      const params = { location: storeId };

      const [fixedAssets, consumables, perishables] = await Promise.all([
        fixedAssetsAPI.getAggregated(params),
        consumablesAPI.getAggregated(params),
        perishablesAPI.getAggregated(params),
      ]);

      setStoreInventories((prev) => ({
        ...prev,
        [storeId]: {
          fixedAssets,
          consumables,
          perishables,
        },
      }));
    } catch (err) {
      console.error('Error fetching store inventory:', err);
    } finally {
      setLoadingStore(null);
    }
  };

  const toggleStore = async (storeId) => {
    const isExpanding = !expandedStores[storeId];
    setExpandedStores((prev) => ({
      ...prev,
      [storeId]: isExpanding,
    }));

    if (isExpanding) {
      await fetchStoreInventory(storeId);
    }
  };

  const handleRefreshStore = async (storeId) => {
    // Clear cached data and refetch
    setStoreInventories((prev) => {
      const newState = { ...prev };
      delete newState[storeId];
      return newState;
    });
    await fetchStoreInventory(storeId);
  };

  const viewDistribution = (itemId, type) => {
    const routes = {
      'fixed-assets': `/dashboard/inventory/fixed-assets/${itemId}/distribution`,
      consumables: `/dashboard/inventory/consumables/${itemId}/distribution`,
      perishables: `/dashboard/inventory/perishables/${itemId}/distribution`,
    };
    navigate(routes[type]);
  };

  // Filter stores by search term
  const filteredStores = stores.filter(
    (store) =>
      store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'fixed-assets', name: 'Fixed Assets', icon: Package },
    { id: 'consumables', name: 'Consumables', icon: Layers },
    { id: 'perishables', name: 'Perishables', icon: Calendar },
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/inventory')}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Inventory
        </button>
      </div>

      {/* Page Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <div>
              <h1 className="text-sm font-bold text-gray-900">All Stores Inventory</h1>
              <p className="text-xs text-gray-500">
                Browse inventory across {stores.length} stores in your hierarchy
              </p>
            </div>
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

      {/* Search and Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stores by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                    isActive
                      ? 'bg-white text-primary-700 shadow-sm font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stores List */}
      <div className="space-y-2">
        {filteredStores.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No stores found</p>
          </div>
        ) : (
          filteredStores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              isExpanded={expandedStores[store.id]}
              isLoading={loadingStore === store.id}
              inventory={storeInventories[store.id]}
              activeTab={activeTab}
              onToggle={() => toggleStore(store.id)}
              onRefresh={() => handleRefreshStore(store.id)}
              onViewDistribution={viewDistribution}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Store Card Component
const StoreCard = ({
  store,
  isExpanded,
  isLoading,
  inventory,
  activeTab,
  onToggle,
  onRefresh,
  onViewDistribution,
}) => {
  // Calculate summary stats
  const getStoreSummary = () => {
    if (!inventory) return null;

    const fa = inventory.fixedAssets?.items || [];
    const con = inventory.consumables?.items || [];
    const per = inventory.perishables?.items || [];

    return {
      fixedAssets: {
        total: fa.reduce((sum, i) => sum + i.total_count, 0),
        inStore: fa.reduce((sum, i) => sum + i.in_store, 0),
        inTransit: fa.reduce((sum, i) => sum + i.in_transit, 0),
        issues: fa.reduce((sum, i) => sum + i.under_repair + i.damaged, 0),
      },
      consumables: {
        total: con.reduce((sum, i) => sum + i.total_quantity, 0),
        available: con.reduce((sum, i) => sum + i.available_quantity, 0),
        lowStock: con.filter((i) => i.is_low_stock).length,
      },
      perishables: {
        total: per.reduce((sum, i) => sum + i.total_quantity, 0),
        batches: per.reduce((sum, i) => sum + i.batch_count, 0),
        expired: per.reduce((sum, i) => sum + i.expired_batches, 0),
      },
    };
  };

  const summary = getStoreSummary();

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Store Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Store className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-gray-900">{store.name}</p>
              {store.code && (
                <span className="text-xs text-gray-500 font-mono">({store.code})</span>
              )}
              {store.is_main_store && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary-100 text-primary-700 rounded">
                  Main Store
                </span>
              )}
            </div>
            {store.parent_location_name && (
              <p className="text-xs text-gray-500">{store.parent_location_name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick Summary Badges */}
          {summary && (
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded">
                <Package className="w-3 h-3" />
                {summary.fixedAssets.inStore}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                <Layers className="w-3 h-3" />
                {summary.consumables.available}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 text-slate-700 rounded">
                <Calendar className="w-3 h-3" />
                {summary.perishables.batches}
              </span>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : inventory ? (
            <div className="p-3 space-y-3">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-green-700">In Store</p>
                      <p className="text-sm font-bold text-green-700">
                        {summary?.fixedAssets.inStore || 0}
                      </p>
                      <p className="text-[10px] text-green-600">Fixed Assets</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-700">In Transit</p>
                      <p className="text-sm font-bold text-blue-700">
                        {summary?.fixedAssets.inTransit || 0}
                      </p>
                      <p className="text-[10px] text-blue-600">Outgoing</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-600" />
                    <div>
                      <p className="text-xs text-slate-700">Consumables</p>
                      <p className="text-sm font-bold text-slate-700">
                        {summary?.consumables.available || 0}
                      </p>
                      <p className="text-[10px] text-slate-600">Available units</p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-xs text-amber-700">Attention</p>
                      <p className="text-sm font-bold text-amber-700">
                        {(summary?.fixedAssets.issues || 0) +
                          (summary?.consumables.lowStock || 0) +
                          (summary?.perishables.expired || 0)}
                      </p>
                      <p className="text-[10px] text-amber-600">Issues/Low/Expired</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'fixed-assets' && (
                <FixedAssetsContent
                  items={inventory.fixedAssets?.items || []}
                  onView={(id) => onViewDistribution(id, 'fixed-assets')}
                />
              )}
              {activeTab === 'consumables' && (
                <ConsumablesContent
                  items={inventory.consumables?.items || []}
                  onView={(id) => onViewDistribution(id, 'consumables')}
                />
              )}
              {activeTab === 'perishables' && (
                <PerishablesContent
                  items={inventory.perishables?.items || []}
                  onView={(id) => onViewDistribution(id, 'perishables')}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-gray-500">Failed to load inventory</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Fixed Assets Content Component
const FixedAssetsContent = ({ items, onView }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-4">
        <Package className="w-6 h-6 text-gray-300 mx-auto mb-1" />
        <p className="text-xs text-gray-500">No fixed assets in this store</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Item</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Total</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">In Store</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">In Use</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Transit</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.slice(0, 10).map((item) => (
              <tr key={item.item_id} className="hover:bg-gray-50">
                <td className="px-2 py-1.5">
                  <p className="text-xs font-medium text-gray-900 truncate max-w-[150px]">
                    {item.item_name}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{item.item_code}</p>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className="text-xs font-bold text-gray-900">{item.total_count}</span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className="text-xs text-green-600 font-medium">{item.in_store}</span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className="text-xs text-slate-600">{item.in_use}</span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className="text-xs text-blue-600">{item.in_transit}</span>
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    onClick={() => onView(item.item_id)}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length > 10 && (
        <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Showing 10 of {items.length} items
          </p>
        </div>
      )}
    </div>
  );
};

// Consumables Content Component
const ConsumablesContent = ({ items, onView }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-4">
        <Layers className="w-6 h-6 text-gray-300 mx-auto mb-1" />
        <p className="text-xs text-gray-500">No consumables in this store</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Item</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Total</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Available</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Status</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.slice(0, 10).map((item) => {
              const isLowStock = item.is_low_stock;
              const isOutOfStock = item.available_quantity === 0;
              return (
                <tr key={item.item_id} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-900 truncate max-w-[150px]">
                      {item.item_name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{item.item_code}</p>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span className="text-xs font-bold text-gray-900">
                      {item.total_quantity} {item.item_unit}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span
                      className={`text-xs font-medium ${
                        isOutOfStock ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {item.available_quantity}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {isOutOfStock ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 rounded">
                        Out
                      </span>
                    ) : isLowStock ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 rounded">
                        Low
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-50 text-green-700 rounded">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button
                      onClick={() => onView(item.item_id)}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length > 10 && (
        <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Showing 10 of {items.length} items
          </p>
        </div>
      )}
    </div>
  );
};

// Perishables Content Component
const PerishablesContent = ({ items, onView }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-4">
        <Calendar className="w-6 h-6 text-gray-300 mx-auto mb-1" />
        <p className="text-xs text-gray-500">No perishables in this store</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Item</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Total</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Batches</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Status</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.slice(0, 10).map((item) => {
              const hasExpired = item.expired_batches > 0;
              const hasNearExpiry = item.near_expiry_batches > 0;
              return (
                <tr key={item.item_id} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-900 truncate max-w-[150px]">
                      {item.item_name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{item.item_code}</p>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span className="text-xs font-bold text-gray-900">
                      {item.total_quantity} {item.item_unit}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span className="text-xs text-gray-700">{item.batch_count}</span>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {hasExpired ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 rounded">
                        {item.expired_batches} exp
                      </span>
                    ) : hasNearExpiry ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 rounded">
                        {item.near_expiry_batches} exp soon
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-50 text-green-700 rounded">
                        Fresh
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button
                      onClick={() => onView(item.item_id)}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length > 10 && (
        <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Showing 10 of {items.length} items
          </p>
        </div>
      )}
    </div>
  );
};

export default AllStoresPage;
