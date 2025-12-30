// src/pages/Inspections/InspectionsList.jsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useInspections } from '../../hooks/queries';
import { useDebounce } from '../../utils/debounce';
import { SkeletonList } from '../../components/common/Skeleton';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const InspectionsList = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Debounce search to reduce API calls
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Build query params
  const queryParams = useMemo(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (stageFilter) params.stage = stageFilter;
    if (statusFilter) params.status = statusFilter;
    return params;
  }, [debouncedSearch, stageFilter, statusFilter]);

  // Fetch inspections with React Query (automatic caching)
  const { data: inspections = [], isLoading: loading, error, refetch } = useInspections(queryParams);

  // Compute filtered inspections (for client-side filtering if needed)
  const filteredInspections = useMemo(() => {
    return inspections.filter((inspection) => {
      const matchesSearch = !searchTerm ||
        inspection.certificate_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.contractor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inspection.contract_no && inspection.contract_no.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStage = !stageFilter || inspection.stage === stageFilter;
      const matchesStatus = !statusFilter || inspection.status === statusFilter;

      return matchesSearch && matchesStage && matchesStatus;
    });
  }, [inspections, searchTerm, stageFilter, statusFilter]);

  const stageColors = {
    INITIATED: 'bg-yellow-100 text-yellow-700',
    STOCK_DETAILS: 'bg-blue-100 text-blue-700',
    CENTRAL_REGISTER: 'bg-purple-100 text-purple-700',
    AUDIT_REVIEW: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-900">Inspection Certificates</h1>
            <p className="text-xs text-gray-600 mt-0.5">Loading inspection certificates...</p>
          </div>
        </div>
        <SkeletonList count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-900">Inspection Certificates</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage material inspection certificates</p>
        </div>
        <Link
          to="/dashboard/inspections/new"
          className="flex items-center gap-0.5 px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Certificate
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Certificates</p>
              <p className="text-base font-bold text-gray-900 mt-0">{inspections.length}</p>
            </div>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">In Progress</p>
              <p className="text-base font-bold text-blue-600 mt-0">
                {inspections.filter(i => i.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-base font-bold text-green-600 mt-0">
                {inspections.filter(i => i.status === 'COMPLETED').length}
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Rejected</p>
              <p className="text-base font-bold text-red-600 mt-0">
                {inspections.filter(i => i.stage === 'REJECTED').length}
              </p>
            </div>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs">
          {error.response?.data?.detail || error.message || 'Failed to load inspection certificates'}
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
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Stages</option>
            <option value="INITIATED">Initiated</option>
            <option value="STOCK_DETAILS">Stock Details</option>
            <option value="CENTRAL_REGISTER">Central Register</option>
            <option value="AUDIT_REVIEW">Audit Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Active Filters */}
        {(searchTerm || stageFilter || statusFilter) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">Ã—</button>
              </span>
            )}
            {stageFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                Stage: {stageFilter}
                <button onClick={() => setStageFilter('')} className="hover:text-purple-900">Ã—</button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('')} className="hover:text-green-900">Ã—</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Certificate</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Contractor</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Department</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Workflow</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Stage</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Status</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Items</th>
                <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-2 py-6 text-center text-xs text-gray-500">
                    No inspection certificates found
                  </td>
                </tr>
              ) : (
                filteredInspections.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 font-mono">
                            {inspection.certificate_no}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(inspection.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="text-xs">
                        <p className="font-medium text-gray-900 truncate">{inspection.contractor_name}</p>
                        {inspection.contract_no && (
                          <p className="text-gray-500">{inspection.contract_no}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-xs text-gray-700">{inspection.department_name}</span>
                    </td>
                    <td className="px-2 py-1">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                        inspection.is_root_department ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {inspection.workflow_type}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                        stageColors[inspection.stage] || 'bg-gray-100 text-gray-700'
                      }`}>
                        {inspection.stage_display}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                        statusColors[inspection.status] || 'bg-gray-100 text-gray-700'
                      }`}>
                        {inspection.status_display}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-xs text-gray-600">{inspection.total_items_count || 0}</span>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <Link
                        to={inspection.stage === 'COMPLETED' 
                          ? `/dashboard/inspections/${inspection.id}/view`
                          : `/dashboard/inspections/${inspection.id}/edit`
                        }
                        className="inline-flex items-center gap-1 p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={inspection.stage === 'COMPLETED' ? 'View' : 'View/Edit'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Summary */}
      {filteredInspections.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 px-2">
          <span>Showing {filteredInspections.length} of {inspections.length} certificates</span>
        </div>
      )}
    </div>
  );
};

export default InspectionsList;