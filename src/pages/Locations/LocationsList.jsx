// src/pages/Locations/LocationsList.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, MapPin, Building2, Store, Filter, Edit } from 'lucide-react';
import { locationsAPI } from '../../api/locations';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants/permissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LocationsList = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermissions();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await locationsAPI.getLocations();
      setLocations(Array.isArray(data) ? data : data.results || []);
      setError('');
    } catch (err) {
      setError('Failed to load locations');
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter locations
  const filteredLocations = locations.filter((location) => {
    const matchesSearch = 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !typeFilter || location.location_type === typeFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && location.is_active) ||
      (statusFilter === 'inactive' && !location.is_active) ||
      (statusFilter === 'standalone' && location.is_standalone) ||
      (statusFilter === 'store' && location.is_store);

    return matchesSearch && matchesType && matchesStatus;
  });

  const typeColors = {
    DEPARTMENT: 'bg-blue-100 text-blue-700',
    BUILDING: 'bg-purple-100 text-purple-700',
    STORE: 'bg-green-100 text-green-700',
    ROOM: 'bg-gray-100 text-gray-700',
    LAB: 'bg-cyan-100 text-cyan-700',
    OFFICE: 'bg-amber-100 text-amber-700',
    JUNKYARD: 'bg-red-100 text-red-700',
    AV_HALL: 'bg-indigo-100 text-indigo-700',
    AUDITORIUM: 'bg-pink-100 text-pink-700',
    OTHER: 'bg-slate-100 text-slate-700',
  };

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
        <div>
          <h1 className="text-sm font-bold text-gray-900">Locations</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage inventory locations and hierarchy</p>
        </div>
        {hasPermission(PERMISSIONS.LOCATIONS.CREATE) && (
          <Link
            to="/dashboard/locations/new"
            className="flex items-center gap-0.5 px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Location
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Locations</p>
              <p className="text-base font-bold text-gray-900 mt-0">{locations.length}</p>
            </div>
            <MapPin className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Standalone</p>
              <p className="text-base font-bold text-purple-600 mt-0">
                {locations.filter(l => l.is_standalone).length}
              </p>
            </div>
            <Building2 className="w-5 h-5 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Stores</p>
              <p className="text-base font-bold text-green-600 mt-0">
                {locations.filter(l => l.is_store).length}
              </p>
            </div>
            <Store className="w-5 h-5 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Active</p>
              <p className="text-base font-bold text-blue-600 mt-0">
                {locations.filter(l => l.is_active).length}
              </p>
            </div>
            <Filter className="w-5 h-5 text-blue-500" />
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
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            <option value="DEPARTMENT">Department</option>
            <option value="BUILDING">Building</option>
            <option value="STORE">Store</option>
            <option value="ROOM">Room</option>
            <option value="LAB">Lab</option>
            <option value="OFFICE">Office</option>
            <option value="JUNKYARD">Junkyard</option>
            <option value="AV_HALL">AV Hall</option>
            <option value="AUDITORIUM">Auditorium</option>
            <option value="OTHER">Other</option>
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
            <option value="standalone">Standalone Only</option>
            <option value="store">Stores Only</option>
          </select>
        </div>

        {/* Active Filters */}
        {(searchTerm || typeFilter || statusFilter !== 'all') && (
          <div className="flex flex-wrap gap-1 mt-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                Type: {typeFilter}
                <button onClick={() => setTypeFilter('')} className="hover:text-purple-900">×</button>
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

      {/* Locations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Location</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Code</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Type</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Parent</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Level</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Flags</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Status</th>
                <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-2 py-6 text-center text-xs text-gray-500">
                    No locations found
                  </td>
                </tr>
              ) : (
                filteredLocations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-900">{location.name}</p>
                          {location.is_root_location && (
                            <span className="text-xs text-purple-600 font-medium">🏛️ Root</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-xs text-gray-600 font-mono">{location.code}</span>
                    </td>
                    <td className="px-2 py-1">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${typeColors[location.location_type] || 'bg-gray-100 text-gray-700'}`}>
                        {location.location_type}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-xs text-gray-500">
                        {location.parent_location_name || '—'}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-xs text-gray-600">
                        Level {location.hierarchy_level || 0}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex flex-wrap gap-0.5">
                        {location.is_standalone && (
                          <span className="inline-flex px-1 py-0.5 bg-purple-50 text-purple-700 text-xs rounded border border-purple-200">
                            Standalone
                          </span>
                        )}
                        {location.is_store && (
                          <span className="inline-flex px-1 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                            Store
                          </span>
                        )}
                        {location.is_main_store && (
                          <span className="inline-flex px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
                            Main
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      {location.is_active ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => navigate(`/dashboard/locations/${location.id}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Location"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LocationsList;