// src/components/common/NotificationBell.jsx
import { useState, useEffect, useRef } from 'react';
import { Bell, FileText, Package, CheckCircle, X, ExternalLink, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../api/users';

const NotificationBell = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingTasks, setPendingTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch pending tasks
  const fetchPendingTasks = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getMyPendingTasks();
      setPendingTasks(data);
    } catch (err) {
      console.error('Error fetching pending tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    fetchPendingTasks();

    // Refresh every 2 minutes
    const interval = setInterval(fetchPendingTasks, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showDropdown) {
      fetchPendingTasks();
    }
  }, [showDropdown]);

  const totalCount = pendingTasks?.counts?.total || 0;

  // Navigation handlers
  const handleInspectionClick = (inspection) => {
    setShowDropdown(false);
    navigate(`/dashboard/inspections/${inspection.id}/edit`);
  };

  const handleAcknowledgmentClick = (entry) => {
    setShowDropdown(false);
    navigate(`/dashboard/acknowledgments/${entry.id}`);
  };

  const handleReturnClick = (returnAck) => {
    setShowDropdown(false);
    navigate(`/dashboard/returns/${returnAck.id}`);
  };

  const handleRequestClick = (request) => {
    setShowDropdown(false);
    navigate(`/dashboard/store-requests/${request.id}`);
  };

  const handleViewAllInspections = () => {
    setShowDropdown(false);
    navigate('/dashboard/inspections');
  };

  const handleViewAllAcknowledgments = () => {
    setShowDropdown(false);
    navigate('/dashboard/acknowledgments');
  };

  const handleViewAllReturns = () => {
    setShowDropdown(false);
    navigate('/dashboard/returns');
  };

  const handleViewAllRequests = () => {
    setShowDropdown(false);
    navigate('/dashboard/store-requests');
  };

  const getStageColor = (stage) => {
    const colors = {
      'INITIATED': 'bg-blue-100 text-blue-800',
      'STOCK_DETAILS': 'bg-purple-100 text-purple-800',
      'CENTRAL_REGISTER': 'bg-indigo-100 text-indigo-800',
      'AUDIT_REVIEW': 'bg-orange-100 text-orange-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getStageLabel = (stage) => {
    const labels = {
      'INITIATED': 'Awaiting Review',
      'STOCK_DETAILS': 'Stock Details',
      'CENTRAL_REGISTER': 'Central Register',
      'AUDIT_REVIEW': 'Audit Review',
    };
    return labels[stage] || stage;
  };

  const getRequestStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'PROCESSING': 'bg-indigo-100 text-indigo-800',
      'DISPATCHED': 'bg-purple-100 text-purple-800',
      'PARTIALLY_DISPATCHED': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRequestStatusLabel = (status) => {
    const labels = {
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress',
      'PROCESSING': 'Processing',
      'DISPATCHED': 'Dispatched',
      'PARTIALLY_DISPATCHED': 'Partially Dispatched',
    };
    return labels[status] || status;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-1.5 rounded-lg transition-all ${
          totalCount > 0
            ? 'hover:bg-red-50 text-red-600 animate-pulse'
            : 'hover:bg-gray-100 text-gray-600'
        }`}
        aria-label="Notifications"
      >
        <Bell className={`w-4 h-4 ${totalCount > 0 ? 'animate-bounce' : ''}`} />

        {/* Badge */}
        {totalCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[14px] h-3.5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-lg animate-pulse">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel - Gmail Style */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-600" />
                Notifications
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {totalCount === 0 ? 'All caught up! 🎉' : `${totalCount} pending ${totalCount === 1 ? 'task' : 'tasks'}`}
              </p>
            </div>
            <button
              onClick={() => setShowDropdown(false)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="text-xs text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                <p className="text-sm font-semibold text-gray-900">All done!</p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  No pending tasks at the moment
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Pending Inspections */}
                {pendingTasks?.inspections?.length > 0 && (
                  <div className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold text-gray-900">
                        Inspection Certificates ({pendingTasks.counts.inspections})
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {pendingTasks.inspections.slice(0, 3).map((inspection) => (
                        <button
                          key={inspection.id}
                          onClick={() => handleInspectionClick(inspection)}
                          className="w-full text-left p-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all group shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {inspection.certificate_no}
                                </p>
                                <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded whitespace-nowrap ${getStageColor(inspection.stage)}`}>
                                  {getStageLabel(inspection.stage)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">
                                {inspection.contractor_name}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {inspection.total_items_count} items • {inspection.department_name}
                              </p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-1 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>

                    {pendingTasks.inspections.length > 3 && (
                      <button
                        onClick={handleViewAllInspections}
                        className="w-full mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View all {pendingTasks.inspections.length} inspections →
                      </button>
                    )}
                  </div>
                )}

                {/* Pending Acknowledgments */}
                {pendingTasks?.acknowledgments?.length > 0 && (
                  <div className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-purple-600" />
                      <h4 className="text-xs font-bold text-gray-900">
                        Stock Acknowledgments ({pendingTasks.counts.acknowledgments})
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {pendingTasks.acknowledgments.slice(0, 3).map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => handleAcknowledgmentClick(entry)}
                          className="w-full text-left p-2 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-all group shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 truncate">
                                {entry.entry_number}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {entry.item_name}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                Qty: {entry.quantity} • From: {entry.from_location_name}
                              </p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-purple-600 flex-shrink-0 mt-1 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>

                    {pendingTasks.acknowledgments.length > 3 && (
                      <button
                        onClick={handleViewAllAcknowledgments}
                        className="w-full mt-2 px-3 py-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        View all {pendingTasks.acknowledgments.length} acknowledgments →
                      </button>
                    )}
                  </div>
                )}

                {/* Pending Returns */}
                {pendingTasks?.returns?.length > 0 && (
                  <div className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <RotateCcw className="w-4 h-4 text-orange-600" />
                      <h4 className="text-xs font-bold text-gray-900">
                        Return Acknowledgments ({pendingTasks.counts.returns})
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {pendingTasks.returns.slice(0, 3).map((returnAck) => (
                        <button
                          key={returnAck.id}
                          onClick={() => handleReturnClick(returnAck)}
                          className="w-full text-left p-2 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-lg transition-all group shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 truncate">
                                {returnAck.entry_number}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {returnAck.item_name}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                Qty: {returnAck.quantity} • To: {returnAck.to_location_name}
                              </p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-orange-600 flex-shrink-0 mt-1 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>

                    {pendingTasks.returns.length > 3 && (
                      <button
                        onClick={handleViewAllReturns}
                        className="w-full mt-2 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        View all {pendingTasks.returns.length} returns →
                      </button>
                    )}
                  </div>
                )}

                {/* Pending Inter-Store Requests */}
                {pendingTasks?.requests?.length > 0 && (
                  <div className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRightLeft className="w-4 h-4 text-green-600" />
                      <h4 className="text-xs font-bold text-gray-900">
                        Inter-Store Requests ({pendingTasks.counts.requests})
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {pendingTasks.requests.slice(0, 3).map((request) => (
                        <button
                          key={request.id}
                          onClick={() => handleRequestClick(request)}
                          className="w-full text-left p-2 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg transition-all group shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {request.request_number}
                                </p>
                                <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded whitespace-nowrap ${getRequestStatusColor(request.status)}`}>
                                  {getRequestStatusLabel(request.status)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">
                                {request.purpose}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {request.items_count} items • From: {request.fulfilling_store_name}
                              </p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-green-600 flex-shrink-0 mt-1 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>

                    {pendingTasks.requests.length > 3 && (
                      <button
                        onClick={handleViewAllRequests}
                        className="w-full mt-2 px-3 py-1.5 text-xs font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        View all {pendingTasks.requests.length} requests →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {totalCount > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-[10px] text-center text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
