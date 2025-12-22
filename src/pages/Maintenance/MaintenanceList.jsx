// src/pages/Maintenance/MaintenanceList.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Calendar, Wrench, Eye, Edit, Trash2, Search, Filter } from 'lucide-react';
import { maintenanceAPI } from '../../api/maintenance';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MaintenanceList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();

  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchMaintenanceRecords();
  }, []);

  const fetchMaintenanceRecords = async () => {
    try {
      setLoading(true);
      const data = await maintenanceAPI.getAll();
      setMaintenanceRecords(data);
      setError('');
    } catch (err) {
      console.error('Error fetching maintenance records:', err);
      setError('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance record?')) {
      return;
    }

    try {
      await maintenanceAPI.delete(id);
      setMaintenanceRecords(prev => prev.filter(record => record.id !== id));
    } catch (err) {
      console.error('Error deleting maintenance record:', err);
      alert('Failed to delete maintenance record');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'DEFERRED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'PREVENTIVE':
        return 'bg-green-100 text-green-800';
      case 'CORRECTIVE':
        return 'bg-red-100 text-red-800';
      case 'EMERGENCY':
        return 'bg-red-200 text-red-900';
      case 'CALIBRATION':
        return 'bg-purple-100 text-purple-800';
      case 'INSPECTION':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecords = maintenanceRecords.filter(record => {
    const matchesSearch =
      record.maintenance_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.instance_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.item_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-sm font-bold text-gray-900">Maintenance Records</h1>
          <p className="text-xs text-gray-600 mt-0">Manage maintenance schedules and records for assets</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/maintenance/new')}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Schedule Maintenance
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by maintenance number, asset code, or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DEFERRED">Deferred</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Maintenance Records List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8">
            <Wrench className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No maintenance records found</p>
            <p className="text-xs text-gray-500 mt-1">Schedule maintenance for your assets</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maintenance #
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Date
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed Date
                  </th>
                  <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/dashboard/maintenance/${record.id}`)}
                  >
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {record.maintenance_number}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="text-xs text-gray-900">
                        {record.item_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.instance_code}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(record.maintenance_type)}`}>
                        {record.maintenance_type_display}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status_display}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900">
                      {new Date(record.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900">
                      {record.completed_date ? new Date(record.completed_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right text-xs font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/maintenance/${record.id}`);
                        }}
                        className="text-primary-600 hover:text-primary-900 mr-2"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/maintenance/${record.id}/edit`);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(record.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredRecords.length > 0 && (
        <div className="text-xs text-gray-600 text-right">
          Showing {filteredRecords.length} of {maintenanceRecords.length} maintenance records
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
