// src/pages/Items/ItemsList.jsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, Edit, Trash2, Box, Tag, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useItems } from '../../hooks/queries';
import { SkeletonList } from '../../components/common/Skeleton';
import { itemsAPI } from '../../api/items';
import {
  canCreateCategoriesOrItems,
  canDeleteCategoriesOrItems,
  getCannotCreateMessage
} from '../../utils/permissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ItemsList = () => {
  const { user: currentUser, permissions: userPermissions } = useAuth();
  const canCreate = canCreateCategoriesOrItems(currentUser, userPermissions);
  const canDelete = canDeleteCategoriesOrItems(currentUser);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [trackingFilter, setTrackingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch all items once - filtering is done client-side
  const { data: items = [], isLoading: loading, error, refetch } = useItems({});

  // Extract unique categories from items
  const categories = useMemo(() => {
    return [...new Map(
      items.map(item => [item.category, {
        id: item.category,
        name: item.category_name
      }])
    ).values()];
  }, [items]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await itemsAPI.delete(item.id);
      refetch(); // Refresh data after delete
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Failed to delete item. It may be in use.');
    }
  };

  // Filter items (client-side)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = !categoryFilter || item.category === parseInt(categoryFilter);
      const matchesTracking = !trackingFilter || item.category_tracking_type === trackingFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.is_active) ||
        (statusFilter === 'inactive' && !item.is_active) ||
        (statusFilter === 'low_stock' && !item.requires_individual_tracking &&
         item.available_quantity <= item.reorder_level && item.reorder_level > 0);

      return matchesSearch && matchesCategory && matchesTracking && matchesStatus;
    });
  }, [items, searchTerm, categoryFilter, trackingFilter, statusFilter]);

  const trackingColors = {
    INDIVIDUAL: 'bg-purple-100 text-purple-700',
    BULK: 'bg-blue-100 text-blue-700',
    BATCH: 'bg-green-100 text-green-700',
  };

  const getStockStatus = (item) => {
    if (item.requires_individual_tracking) {
      return {
        text: `${item.total_instances || 0} instances`,
        color: 'text-gray-600'
      };
    }
    
    const qty = item.available_quantity || 0;
    const reorder = item.reorder_level || 0;
    
    if (qty === 0) {
      return { text: 'Out of Stock', color: 'text-red-600 font-medium' };
    } else if (qty <= reorder && reorder > 0) {
      return { text: `Low (${qty})`, color: 'text-orange-600 font-medium' };
    }
    return { text: `${qty}`, color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-900">Items Catalog</h1>
            <p className="text-xs text-gray-600 mt-0.5">Loading items...</p>
          </div>
        </div>
        <SkeletonList count={10} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-900">Items</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage inventory items and categories</p>
        </div>
        {canCreate ? (
          <Link
            to="/dashboard/items/new"
            className="flex items-center gap-0.5 px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Item
          </Link>
        ) : (
          <button
            onClick={() => alert(getCannotCreateMessage(currentUser))}
            className="flex items-center gap-0.5 px-2 py-1 bg-gray-300 text-gray-600 text-xs rounded-lg cursor-not-allowed"
            title={getCannotCreateMessage(currentUser)}
          >
            <Plus className="w-3.5 h-3.5" />
            New Item
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Items</p>
              <p className="text-base font-bold text-gray-900 mt-0">{items.length}</p>
            </div>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Categories</p>
              <p className="text-base font-bold text-purple-600 mt-0">
                {categories.length}
              </p>
            </div>
            <Tag className="w-5 h-5 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Individual Tracking</p>
              <p className="text-base font-bold text-green-600 mt-0">
                {items.filter(i => i.requires_individual_tracking).length}
              </p>
            </div>
            <Box className="w-5 h-5 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Active</p>
              <p className="text-base font-bold text-blue-600 mt-0">
                {items.filter(i => i.is_active).length}
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Permission Warning */}
      {!canCreate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-yellow-900">Limited Access</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              {getCannotCreateMessage(currentUser)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <form onSubmit={(e) => e.preventDefault()} className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="search"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Tracking Type Filter */}
          <select
            value={trackingFilter}
            onChange={(e) => setTrackingFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Tracking Types</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="BULK">Bulk</option>
            <option value="BATCH">Batch</option>
          </select>
        </div>

        {/* Second row - Status Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="low_stock">Low Stock</option>
          </select>
        </div>

        {/* Active Filters */}
        {(searchTerm || categoryFilter || trackingFilter || statusFilter !== 'all') && (
          <div className="flex flex-wrap gap-1 mt-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                Search: {searchTerm}
                <button type="button" onClick={() => setSearchTerm('')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {categoryFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                Category: {categories.find(c => c.id === parseInt(categoryFilter))?.name}
                <button type="button" onClick={() => setCategoryFilter('')} className="hover:text-purple-900">×</button>
              </span>
            )}
            {trackingFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                Tracking: {trackingFilter}
                <button type="button" onClick={() => setTrackingFilter('')} className="hover:text-green-900">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-orange-900">×</button>
              </span>
            )}
          </div>
        )}
      </form>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Item</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Code</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Category</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Tracking</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Unit</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Stock</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Status</th>
                <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-2 py-6 text-center text-xs text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-xs text-gray-500 truncate">
                                {item.description.substring(0, 40)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <span className="text-xs text-gray-900 font-mono">{item.code}</span>
                      </td>
                      <td className="px-2 py-1">
                        <span className="text-xs text-gray-700">{item.category_name}</span>
                      </td>
                      <td className="px-2 py-1">
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                          trackingColors[item.category_tracking_type] || 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.category_tracking_type_display}
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <span className="text-xs text-gray-600">{item.acct_unit}</span>
                      </td>
                      <td className="px-2 py-1">
                        <div>
                          <span className={`text-xs ${stockStatus.color}`}>
                            {stockStatus.text}
                          </span>
                          {!item.requires_individual_tracking && item.reorder_level > 0 && (
                            <p className="text-xs text-gray-400">
                              Reorder: {item.reorder_level}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                          item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canCreate && (
                            <Link
                              to={`/dashboard/items/${item.id}`}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!canCreate && !canDelete && (
                            <span className="text-xs text-gray-400 px-2">Read-only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Summary */}
      {filteredItems.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 px-2">
          <span>Showing {filteredItems.length} of {items.length} items</span>
        </div>
      )}
    </div>
  );
};

export default ItemsList;