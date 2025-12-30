// src/pages/Dashboard.jsx
import { useAuth } from '../hooks/useAuth';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  FileText,
  FolderTree,
  BoxIcon,
  CheckSquare,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  Users,
  MapPin,
  BarChart3,
  Activity,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useDashboardStats } from '../hooks/queries/useDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use React Query hook for automatic caching and background refetching
  const { data: dashboardData, isLoading: loading, error } = useDashboardStats();

  // Memoize computed values to prevent unnecessary recalculations
  const stats = useMemo(() => {
    if (!dashboardData) {
      return {
        stockEntries: 0,
        inspections: 0,
        categories: 0,
        items: 0,
        locations: 0,
        pendingAcknowledgments: 0,
      };
    }

    const counts = dashboardData.counts || {};
    const pendingTasks = dashboardData.pending_tasks || {};

    return {
      stockEntries: counts.total_stock_entries || 0,
      inspections: counts.total_inspections || 0,
      categories: counts.total_categories || 0,
      items: counts.total_items || 0,
      locations: counts.total_locations || 0,
      pendingAcknowledgments: (pendingTasks.acknowledgments || 0) + (pendingTasks.returns || 0),
    };
  }, [dashboardData]);

  const recentActivity = useMemo(() => {
    if (!dashboardData) return [];

    const recentActivityData = dashboardData.recent_activity || {};

    const recentStockEntries = (recentActivityData.stock_entries || []).map((entry) => ({
      type: 'stock',
      title: `Stock Transfer: ${entry.item_name || 'Item'}`,
      subtitle: `From ${entry.from_location_name || 'Unknown'} to ${entry.to_location_name || 'Unknown'}`,
      time: entry.created_at,
      status: entry.status,
    }));

    const recentInspections = (recentActivityData.inspections || []).map((inspection) => ({
      type: 'inspection',
      title: `Inspection: ${inspection.certificate_no}`,
      subtitle: `${inspection.department_name || 'Unknown Department'}`,
      time: inspection.created_at,
      status: inspection.stage,
    }));

    return [...recentStockEntries, ...recentInspections].slice(0, 5);
  }, [dashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    {
      name: 'Total Items',
      value: stats.items,
      icon: BoxIcon,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: '+12%',
      trendUp: true,
      link: '/dashboard/items',
    },
    {
      name: 'Stock Entries',
      value: stats.stockEntries,
      icon: Package,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: '+8%',
      trendUp: true,
      link: '/dashboard/stock-entries',
    },
    {
      name: 'Inspections',
      value: stats.inspections,
      icon: FileText,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: '+5%',
      trendUp: true,
      link: '/dashboard/inspections',
    },
    {
      name: 'Locations',
      value: stats.locations,
      icon: MapPin,
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      trend: '0%',
      trendUp: false,
      link: '/dashboard/locations',
    },
  ];

  const quickActions = [
    { name: 'New Stock Entry', icon: Package, link: '/dashboard/stock-entries/new', color: 'primary' },
    { name: 'New Inspection', icon: FileText, link: '/dashboard/inspections/new', color: 'purple' },
    { name: 'Add Item', icon: BoxIcon, link: '/dashboard/items/new', color: 'green' },
    { name: 'View Inventory', icon: BarChart3, link: '/dashboard/inventory', color: 'blue' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {getGreeting()}, {user?.first_name || user?.full_name || user?.username || 'User'}!
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Welcome back to your inventory dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-4 h-4" />
            {stats.pendingAcknowledgments > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.name}
              onClick={() => navigate(card.link)}
              className="stat-card text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 ${card.bgColor} rounded-lg`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-600">{card.name}</p>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-xl font-bold text-gray-900">{card.value}</h3>
                  <span className={`text-xs font-medium ${card.trendUp ? 'text-green-600' : 'text-gray-500'}`}>
                    {card.trend}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>

            <div className="space-y-1.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.name}
                    onClick={() => navigate(action.link)}
                    className="w-full flex items-center gap-2 p-2 text-left rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`p-1.5 bg-${action.color}-50 rounded-lg`}>
                      <Icon className={`w-3.5 h-3.5 text-${action.color}-600`} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                      {action.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full mb-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-600">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-1.5 ${activity.type === 'stock' ? 'bg-green-50' : 'bg-purple-50'} rounded-lg mt-0.5`}>
                      {activity.type === 'stock' ? (
                        <Package className={`w-3.5 h-3.5 ${activity.type === 'stock' ? 'text-green-600' : 'text-purple-600'}`} />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {activity.subtitle}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(activity.time).toLocaleDateString()} at{' '}
                        {new Date(activity.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                      activity.status === 'COMPLETED' || activity.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Alerts & Notifications */}
        {stats.pendingAcknowledgments > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-2.5">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                  Pending Acknowledgments
                </h3>
                <p className="text-xs text-gray-700 mb-2">
                  You have {stats.pendingAcknowledgments} stock {stats.pendingAcknowledgments === 1 ? 'entry' : 'entries'} awaiting acknowledgment
                </p>
                <button
                  onClick={() => navigate('/dashboard/acknowledgments')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-amber-700 font-medium text-xs rounded-lg hover:bg-amber-50 transition-colors"
                >
                  Review Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Information */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-2.5">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Users className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                {user?.role_display || 'User'} Dashboard
              </h3>
              <p className="text-xs text-gray-700">
                You have access to {stats.categories} categories, {stats.items} items, and {stats.locations} locations in the system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
