// src/pages/Admin/PermissionsView.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Search,
  FileText,
  Package,
  MapPin,
  Users,
  Wrench,
  ArrowRightLeft,
  CheckSquare,
} from 'lucide-react';

const PermissionsView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Django permissions organized by category
  const permissionCategories = {
    inspections: {
      label: 'Inspections',
      icon: FileText,
      color: 'purple',
      permissions: [
        { codename: 'initiate_inspectioncertificate', name: 'Can initiate inspection' },
        { codename: 'fill_stock_details', name: 'Can fill stock details (Stage 2)' },
        { codename: 'fill_central_register', name: 'Can fill central register (Stage 3)' },
        { codename: 'review_as_auditor', name: 'Can review as auditor (Stage 4)' },
        { codename: 'download_inspection_pdf', name: 'Can download inspection PDF' },
        { codename: 'link_inspection_items', name: 'Can link inspection items' },
        { codename: 'reject_inspectioncertificate', name: 'Can reject inspection' },
        { codename: 'view_inspectioncertificate', name: 'Can view inspection certificate' },
        { codename: 'add_inspectioncertificate', name: 'Can add inspection certificate' },
        { codename: 'change_inspectioncertificate', name: 'Can change inspection certificate' },
        { codename: 'delete_inspectioncertificate', name: 'Can delete inspection certificate' },
      ],
    },
    stock: {
      label: 'Stock & Inventory',
      icon: Package,
      color: 'emerald',
      permissions: [
        { codename: 'issue_stock', name: 'Can issue stock' },
        { codename: 'receive_stock', name: 'Can receive stock' },
        { codename: 'transfer_stock', name: 'Can transfer stock' },
        { codename: 'acknowledge_stock', name: 'Can acknowledge transfers' },
        { codename: 'return_stock', name: 'Can process returns' },
        { codename: 'upward_transfer', name: 'Can transfer to parent standalone' },
        { codename: 'view_stockentry', name: 'Can view stock entry' },
        { codename: 'add_stockentry', name: 'Can add stock entry' },
        { codename: 'change_stockentry', name: 'Can change stock entry' },
        { codename: 'delete_stockentry', name: 'Can delete stock entry' },
        { codename: 'view_iteminstance', name: 'Can view item instance' },
        { codename: 'view_itembatch', name: 'Can view item batch' },
      ],
    },
    locations: {
      label: 'Locations',
      icon: MapPin,
      color: 'blue',
      permissions: [
        { codename: 'manage_all_locations', name: 'Can access all locations' },
        { codename: 'create_standalone_location', name: 'Can create standalone locations' },
        { codename: 'view_location', name: 'Can view location' },
        { codename: 'add_location', name: 'Can add location' },
        { codename: 'change_location', name: 'Can change location' },
        { codename: 'delete_location', name: 'Can delete location' },
      ],
    },
    users: {
      label: 'User Management',
      icon: Users,
      color: 'gray',
      permissions: [
        { codename: 'is_central_store_incharge', name: 'Is central store incharge' },
        { codename: 'view_all_reports', name: 'Can view all reports' },
        { codename: 'export_all_data', name: 'Can export data' },
        { codename: 'assign_permissions', name: 'Can assign permissions' },
        { codename: 'view_userprofile', name: 'Can view user profile' },
        { codename: 'add_userprofile', name: 'Can add user profile' },
        { codename: 'change_userprofile', name: 'Can change user profile' },
        { codename: 'delete_userprofile', name: 'Can delete user profile' },
      ],
    },
    maintenance: {
      label: 'Maintenance',
      icon: Wrench,
      color: 'amber',
      permissions: [
        { codename: 'complete_maintenance', name: 'Can complete maintenance' },
        { codename: 'approve_maintenance', name: 'Can approve maintenance' },
        { codename: 'view_maintenancerecord', name: 'Can view maintenance record' },
        { codename: 'add_maintenancerecord', name: 'Can add maintenance record' },
        { codename: 'change_maintenancerecord', name: 'Can change maintenance record' },
        { codename: 'delete_maintenancerecord', name: 'Can delete maintenance record' },
      ],
    },
    interstore: {
      label: 'Inter-Store Requests',
      icon: ArrowRightLeft,
      color: 'indigo',
      permissions: [
        { codename: 'view_interstorerequest', name: 'Can view inter-store request' },
        { codename: 'add_interstorerequest', name: 'Can add inter-store request' },
        { codename: 'change_interstorerequest', name: 'Can change inter-store request' },
        { codename: 'delete_interstorerequest', name: 'Can delete inter-store request' },
      ],
    },
    acknowledgments: {
      label: 'Acknowledgments',
      icon: CheckSquare,
      color: 'teal',
      permissions: [
        { codename: 'view_bulkacknowledgment', name: 'Can view bulk acknowledgment' },
        { codename: 'add_bulkacknowledgment', name: 'Can add bulk acknowledgment' },
        { codename: 'change_bulkacknowledgment', name: 'Can change bulk acknowledgment' },
        { codename: 'delete_bulkacknowledgment', name: 'Can delete bulk acknowledgment' },
      ],
    },
  };

  const filteredCategories = Object.entries(permissionCategories).filter(([key, category]) => {
    if (selectedCategory !== 'all' && key !== selectedCategory) return false;

    if (searchTerm) {
      const hasMatch = category.permissions.some(
        perm =>
          perm.codename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return hasMatch;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard/admin')}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">System Permissions</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View all available Django permissions in the system
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white"
          >
            <option value="all">All Categories</option>
            {Object.entries(permissionCategories).map(([key, category]) => (
              <option key={key} value={key}>{category.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="space-y-4">
        {filteredCategories.map(([key, category]) => {
          const Icon = category.icon;
          const filteredPerms = category.permissions.filter(
            perm =>
              !searchTerm ||
              perm.codename.toLowerCase().includes(searchTerm.toLowerCase()) ||
              perm.name.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (filteredPerms.length === 0) return null;

          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className={`px-4 py-3 bg-${category.color}-50 border-b border-${category.color}-100`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${category.color}-600`} />
                  <h2 className="text-sm font-semibold text-gray-900">{category.label}</h2>
                  <span className="px-2 py-0.5 bg-white text-gray-600 text-xs rounded-full">
                    {filteredPerms.length} permissions
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredPerms.map((perm) => (
                    <div
                      key={perm.codename}
                      className="flex items-start gap-3 px-3 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900">{perm.name}</p>
                        <p className="text-xs text-gray-500 font-mono truncate">{perm.codename}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No permissions found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
};

export default PermissionsView;
