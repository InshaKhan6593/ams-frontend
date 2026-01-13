// src/pages/Inventory/NonStoreInventory.jsx
// Inventory view for non-store locations (departments, labs, rooms, offices, etc.)
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  Layers,
  Calendar,
  MapPin,
  RefreshCw,
  AlertCircle,
  Eye,
  TrendingUp,
  Building2,
  Search,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { consumablesAPI, perishablesAPI } from '../../api/inventory';
import { locationsAPI } from '../../api/locations';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const NonStoreInventory = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('consumables');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Inventory data for each type
  const [consumablesData, setConsumablesData] = useState({ items: [], accessible_stores: [] });
  const [perishablesData, setPerishablesData] = useState({ items: [], accessible_stores: [] });
  const [tabLoading, setTabLoading] = useState(false);
  const [accessibleLocations, setAccessibleLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  // Initial load - get user's accessible non-store locations
  useEffect(() => {
    const initializeLocations = async () => {
      try {
        setLoading(true);
        const response = await locationsAPI.getUserAccessibleLocations();

        // API returns: { user_role, responsible_location, locations, count }
        const locationsList = response.locations || [];
        // Filter to non-store locations only
        const nonStores = locationsList.filter((l) => !l.is_store);
        setAccessibleLocations(nonStores);

        // Set first non-store location as default
        if (nonStores.length > 0) {
          setSelectedLocation(nonStores[0]);
          setSelectedLocationId(nonStores[0].id);
        }
      } catch (err) {
        console.error('Error initializing locations:', err);
        setError('Failed to load location information');
      } finally {
        setLoading(false);
      }
    };
    initializeLocations();
  }, []);

  // Fetch inventory data when location selection or tab changes
  useEffect(() => {
    if (!loading && selectedLocationId) {
      fetchInventoryData();
    }
  }, [selectedLocationId, activeTab, loading]);

  const fetchInventoryData = async () => {
    try {
      setTabLoading(true);
      setError('');

      // Filter by selected location
      const params = { location: selectedLocationId };

      if (activeTab === 'consumables') {
        const data = await consumablesAPI.getAggregated(params);
        setConsumablesData(data);
      } else if (activeTab === 'perishables') {
        const data = await perishablesAPI.getAggregated(params);
        setPerishablesData(data);
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to load inventory data. Please try again.');
    } finally {
      setTabLoading(false);
    }
  };

  const handleLocationChange = (e) => {
    const locationId = parseInt(e.target.value);
    setSelectedLocationId(locationId);
    const location = accessibleLocations.find((l) => l.id === locationId);
    setSelectedLocation(location);
  };

  const handleRefresh = () => {
    fetchInventoryData();
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'consumables':
        return consumablesData;
      case 'perishables':
        return perishablesData;
      default:
        return { items: [] };
    }
  };

  // Calculate totals based on active tab
  const calculateTotals = () => {
    const currentData = getCurrentData();
    const items = currentData.items || [];

    if (activeTab === 'consumables') {
      return items.reduce(
        (acc, item) => ({
          totalQty: acc.totalQty + (item.total_quantity || 0),
          inUse: acc.inUse + (item.in_use || 0),
          available: acc.available + (item.available_quantity || 0),
        }),
        { totalQty: 0, inUse: 0, available: 0 }
      );
    } else if (activeTab === 'perishables') {
      return items.reduce(
        (acc, item) => ({
          totalQty: acc.totalQty + (item.total_quantity || 0),
          inUse: acc.inUse + (item.in_use || 0),
          batches: acc.batches + (item.total_batches || 0),
          nearExpiry: acc.nearExpiry + (item.near_expiry_quantity || 0),
          expired: acc.expired + (item.expired_quantity || 0),
        }),
        { totalQty: 0, inUse: 0, batches: 0, nearExpiry: 0, expired: 0 }
      );
    }

    return {};
  };

  // Filter items based on search term
  const getFilteredItems = () => {
    const currentData = getCurrentData();
    const items = currentData.items || [];

    if (!searchTerm.trim()) return items;

    return items.filter(
      (item) =>
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (accessibleLocations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <Building2 className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Non-Store Locations</h2>
        <p className="text-gray-600 text-center max-w-md">
          You don't have access to any non-store locations (departments, labs, rooms, etc.).
        </p>
        <button
          onClick={() => navigate('/inventory')}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </button>
      </div>
    );
  }

  const totals = calculateTotals();
  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-900">Non-Store Inventory</span>
              </div>
              <p className="text-[10px] text-gray-500">
                Track consumables & perishables at departments, labs, and other locations
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
            <button
              onClick={() => navigate('/dashboard/inventory')}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Location Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Location:</span>
          </div>
          <select
            value={selectedLocationId || ''}
            onChange={handleLocationChange}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            {accessibleLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} ({location.location_type})
              </option>
            ))}
          </select>
        </div>
        {selectedLocation && (
          <div className="mt-2 text-[10px] text-gray-500">
            <span className="font-medium">Type:</span> {selectedLocation.location_type} •{' '}
            <span className="font-medium">Code:</span> {selectedLocation.code}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('consumables')}
            className={`flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'consumables'
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="w-3.5 h-3.5 flex-shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Consumables</p>
              <p className="text-[10px] text-gray-500 truncate hidden sm:block">Bulk items</p>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('perishables')}
            className={`flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'perishables'
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Perishables</p>
              <p className="text-[10px] text-gray-500 truncate hidden sm:block">Batch tracked</p>
            </div>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {activeTab === 'consumables' && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-xs text-gray-500">Total Qty</p>
            <p className="text-lg font-bold text-gray-900">{totals.totalQty || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-xs text-gray-500">In Use</p>
            <p className="text-lg font-bold text-green-600">{totals.inUse || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-xs text-gray-500">Available</p>
            <p className="text-lg font-bold text-slate-600">{totals.available || 0}</p>
          </div>
        </div>
      )}

      {activeTab === 'perishables' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-xs text-gray-500">Total Qty</p>
            <p className="text-lg font-bold text-gray-900">{totals.totalQty || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-xs text-gray-500">In Use</p>
            <p className="text-lg font-bold text-green-600">{totals.inUse || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-xs text-gray-500">Batches</p>
            <p className="text-lg font-bold text-slate-600">{totals.batches || 0}</p>
          </div>
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-2">
            <p className="text-xs text-amber-700">Near Expiry</p>
            <p className="text-lg font-bold text-amber-600">{totals.nearExpiry || 0}</p>
          </div>
          <div className="bg-red-50 rounded-lg border border-red-200 p-2">
            <p className="text-xs text-red-700">Expired</p>
            <p className="text-lg font-bold text-red-600">{totals.expired || 0}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by item name, code, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Data Table */}
      {tabLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                {searchTerm ? 'No items found' : 'No inventory at this location'}
              </h3>
              <p className="text-xs text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'No consumables or perishables have been issued to this location yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Total Qty
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      In Use
                    </th>
                    {activeTab === 'consumables' && (
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Available
                      </th>
                    )}
                    {activeTab === 'perishables' && (
                      <>
                        <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                          Batches
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                          Near Expiry
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                          Expired
                        </th>
                      </>
                    )}
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.item_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">{item.item_name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{item.item_code}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-primary-100 text-primary-700">
                          {item.category_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-900">
                        {item.total_quantity || 0}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <span className="text-xs font-semibold text-green-600">
                          {item.in_use || 0}
                        </span>
                      </td>
                      {activeTab === 'consumables' && (
                        <td className="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-900">
                          {item.available_quantity || 0}
                        </td>
                      )}
                      {activeTab === 'perishables' && (
                        <>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-900">
                            {item.total_batches || 0}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right">
                            {item.near_expiry_quantity > 0 ? (
                              <span className="text-xs font-medium text-amber-600">
                                {item.near_expiry_quantity}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right">
                            {item.expired_quantity > 0 ? (
                              <span className="text-xs font-medium text-red-600">
                                {item.expired_quantity}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">0</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                        <Link
                          to={
                            activeTab === 'consumables'
                              ? `/inventory/consumables/${item.item_id}/distribution`
                              : `/inventory/perishables/${item.item_id}/distribution`
                          }
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <Eye className="w-3 h-3 mr-0.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <div>
          <span className="font-medium">About Non-Store Inventory:</span> This page shows
          consumables and perishables issued to departments, labs, rooms, etc. The{' '}
          <strong>"In Use"</strong> quantity represents items currently at this location that can be
          returned to a store if needed.
        </div>
      </div>
    </div>
  );
};

export default NonStoreInventory;
