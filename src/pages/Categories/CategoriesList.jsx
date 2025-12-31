// src/pages/Categories/CategoriesList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Tag, Edit, Trash2, FolderTree, Box, Package, AlertCircle } from 'lucide-react';
import { categoriesAPI } from '../../api/items';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { canCreateCategoriesOrItems, canDeleteCategoriesOrItems, getCannotCreateMessage } from '../../utils/permissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CategoriesList = () => {
  const { user: currentUser, permissions: userPermissions } = useAuth();
  const { isSystemAdmin } = usePermissions();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingFilter, setTrackingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesAPI.getAll();
      setCategories(data); // getAll() now returns all categories across all pages
      setError('');
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This will also delete all subcategories and may affect items.`)) {
      return;
    }

    try {
      await categoriesAPI.delete(category.id);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Failed to delete category. It may be in use by items.');
    }
  };

  // Filter categories
  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTracking = !trackingFilter || category.inherited_tracking_type === trackingFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && category.is_active) ||
      (statusFilter === 'inactive' && !category.is_active) ||
      (statusFilter === 'parent' && !category.parent_category) ||
      (statusFilter === 'child' && category.parent_category);

    return matchesSearch && matchesTracking && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, trackingFilter, statusFilter]);

  const trackingColors = {
    INDIVIDUAL: 'bg-purple-100 text-purple-700',
    BULK: 'bg-blue-100 text-blue-700',
    BATCH: 'bg-green-100 text-green-700',
  };

  const trackingIcons = {
    INDIVIDUAL: Box,
    BULK: Package,
    BATCH: FolderTree,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Check if user can create categories
  const canCreate = canCreateCategoriesOrItems(currentUser, userPermissions);
  const canDelete = canDeleteCategoriesOrItems(currentUser);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-900">Categories</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage item categories and tracking types</p>
        </div>
        {canCreate ? (
          <Link
            to="/dashboard/categories/new"
            className="flex items-center gap-0.5 px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Category
          </Link>
        ) : (
          <button
            onClick={() => alert(getCannotCreateMessage(currentUser))}
            className="flex items-center gap-0.5 px-2 py-1 bg-gray-300 text-gray-600 text-xs rounded-lg cursor-not-allowed"
            title={getCannotCreateMessage(currentUser)}
          >
            <Plus className="w-3.5 h-3.5" />
            New Category
          </button>
        )}
      </div>

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Categories</p>
              <p className="text-base font-bold text-gray-900 mt-0">{categories.length}</p>
            </div>
            <Tag className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Broader Categories</p>
              <p className="text-base font-bold text-indigo-600 mt-0">
                {categories.filter(c => !c.parent_category).length}
              </p>
            </div>
            <FolderTree className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Sub-Categories</p>
              <p className="text-base font-bold text-cyan-600 mt-0">
                {categories.filter(c => c.parent_category).length}
              </p>
            </div>
            <Tag className="w-5 h-5 text-cyan-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Fixed Assets</p>
              <p className="text-base font-bold text-purple-600 mt-0">
                {categories.filter(c => c.inherited_tracking_type === 'INDIVIDUAL').length}
              </p>
            </div>
            <Box className="w-5 h-5 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Consumables</p>
              <p className="text-base font-bold text-blue-600 mt-0">
                {categories.filter(c => c.inherited_tracking_type === 'BULK').length}
              </p>
            </div>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="parent">Parent Categories</option>
            <option value="child">Subcategories</option>
          </select>
        </div>

        {/* Active Filters */}
        {(searchTerm || trackingFilter || statusFilter !== 'all') && (
          <div className="flex flex-wrap gap-1 mt-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {trackingFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                Tracking: {trackingFilter}
                <button onClick={() => setTrackingFilter('')} className="hover:text-purple-900">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="hover:text-green-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Category</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Code</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Tracking</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Hierarchy</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Items</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Settings</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Status</th>
                <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentCategories.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-2 py-6 text-center text-xs text-gray-500">
                    No categories found
                  </td>
                </tr>
              ) : (
                currentCategories.map((category) => {
                  const TrackingIcon = trackingIcons[category.tracking_type] || Tag;
                  const isBroaderCategory = !category.parent_category;
                  const categoryTypeDisplay = {
                    'FIXED_ASSET': 'Fixed Asset',
                    'CONSUMABLE': 'Consumable',
                    'PERISHABLE': 'Perishable'
                  };

                  return (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1.5">
                          {isBroaderCategory ? (
                            <FolderTree className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <div className="w-3 border-t border-gray-300"></div>
                              <Tag className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {category.name}
                            </p>
                            {category.description && (
                              <p className="text-xs text-gray-500 truncate">
                                {category.description.substring(0, 40)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <span className="text-xs text-gray-900 font-mono">{category.code}</span>
                      </td>
                      <td className="px-2 py-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded ${
                          trackingColors[category.tracking_type] || 'bg-gray-100 text-gray-700'
                        }`}>
                          <TrackingIcon className="w-3 h-3" />
                          {category.tracking_type_display}
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        {category.parent_category_name ? (
                          <span className="text-xs text-gray-700">
                            ↳ {category.parent_category_name}
                          </span>
                        ) : (
                          <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                            Broader
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        <span className="text-xs text-gray-600">{category.items_count || 0}</span>
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex flex-wrap gap-0.5">
                          {/* Show depreciation for sub-categories of fixed assets (INDIVIDUAL tracking) */}
                          {category.parent_category && category.inherited_tracking_type === 'INDIVIDUAL' && (
                            <>
                              {category.depreciation_rate > 0 && (
                                <span className="inline-flex px-1 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                                  {category.depreciation_rate}% {category.depreciation_method}
                                </span>
                              )}
                            </>
                          )}
                          {!category.parent_category && !category.depreciation_rate && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                          category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canCreate && (
                            <Link
                              to={`/dashboard/categories/${category.id}`}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(category)}
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

      {/* Pagination Controls */}
      {filteredCategories.length > itemsPerPage && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCategories.length)} of {filteredCategories.length} categories
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="text-gray-400 px-1">...</span>;
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Summary */}
      {filteredCategories.length > 0 && filteredCategories.length <= itemsPerPage && (
        <div className="flex items-center justify-between text-xs text-gray-600 px-2">
          <span>Showing all {filteredCategories.length} of {categories.length} categories</span>
        </div>
      )}
    </div>
  );
};

export default CategoriesList;