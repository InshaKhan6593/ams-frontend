// src/pages/Admin/GroupsManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Users, Lock, ChevronDown, ChevronUp, Check, Layers } from 'lucide-react';
import { groupsAPI } from '../../api/users';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const GroupsManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [expandedGroup, setExpandedGroup] = useState(null);

  const groupInfo = {
    'Location Head': {
      description: 'Manages locations and initiates inspections',
      color: 'blue',
      permissions: ['Initiate inspections', 'Manage location users', 'View inventory', 'Approve stock']
    },
    'Stock Incharge': {
      description: 'Manages store inventory and stock movements',
      color: 'emerald',
      permissions: ['Issue/receive stock', 'Transfer inventory', 'Fill stock details', 'Manage store']
    },
    'Central Store Incharge': {
      description: 'Root store manager with Stage 3 access',
      color: 'purple',
      permissions: ['Fill central register', 'Link inspection items', 'All stock operations']
    },
    'Auditor': {
      description: 'Reviews and audits inspection certificates',
      color: 'amber',
      permissions: ['Review inspections', 'View all locations', 'Export reports', 'Complete audits']
    },
    'Viewer': {
      description: 'Read-only access to view data',
      color: 'gray',
      permissions: ['View inventory', 'View inspections', 'View locations', 'View reports']
    },
  };

  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-600' },
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await groupsAPI.getAll();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setGroups([
        { id: 1, name: 'Location Head' },
        { id: 2, name: 'Stock Incharge' },
        { id: 3, name: 'Central Store Incharge' },
        { id: 4, name: 'Auditor' },
        { id: 5, name: 'Viewer' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard/admin')}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-gray-900">Permission Groups</h1>
          <p className="text-xs text-gray-500">Django Groups for role-based access</p>
        </div>
      </div>

      {/* Groups List */}
      <div className="space-y-2">
        {groups.map((group) => {
          const info = groupInfo[group.name] || { color: 'gray', description: 'Permission group', permissions: [] };
          const colors = colorMap[info.color] || colorMap.gray;
          const isExpanded = expandedGroup === group.id;

          return (
            <div key={group.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
              >
                <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <Layers className={`w-4 h-4 ${colors.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-gray-900">{group.name}</h3>
                  <p className="text-xs text-gray-400">{info.description}</p>
                </div>
                <span className={`px-1.5 py-0.5 ${colors.bg} ${colors.text} text-xs rounded`}>
                  {info.permissions.length}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {isExpanded && info.permissions.length > 0 && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  <div className="pt-2 flex flex-wrap gap-1">
                    {info.permissions.map((perm, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2 py-1 ${colors.bg} ${colors.text} text-xs rounded`}
                      >
                        <Check className="w-3 h-3" />
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 px-3 py-2">
        <p className="text-xs text-gray-600">
          <span className="font-medium">Note:</span> Groups are managed via Django admin. Users can also receive individual permissions through the user edit form.
        </p>
      </div>
    </div>
  );
};

export default GroupsManagement;
