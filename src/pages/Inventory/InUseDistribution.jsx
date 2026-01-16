import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, AlertCircle, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { locationInventoryAPI } from '../../api/inventory';

const InUseDistribution = () => {
  const { locationInventoryId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLocations, setExpandedLocations] = useState({});

  useEffect(() => {
    fetchData();
  }, [locationInventoryId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await locationInventoryAPI.getInUseDistribution(locationInventoryId);
      setData(response);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load distribution');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (locationId) => {
    setExpandedLocations(prev => ({
      ...prev,
      [locationId]: !prev[locationId]
    }));
  };

  const getLocationTypeBadgeColor = (locationType) => {
    const colors = {
      'LAB': 'bg-purple-100 text-purple-700',
      'ROOM': 'bg-blue-100 text-blue-700',
      'OFFICE': 'bg-slate-100 text-slate-700',
      'AV_HALL': 'bg-indigo-100 text-indigo-700',
      'AUDITORIUM': 'bg-pink-100 text-pink-700',
      'JUNKYARD': 'bg-gray-100 text-gray-700',
      'OTHER': 'bg-gray-100 text-gray-700',
    };
    return colors[locationType] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading distribution...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">In-Use Distribution</h1>
          <p className="text-sm text-gray-500">View where items are currently in use</p>
        </div>
      </div>

      {/* Item & Store Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Item Details</h2>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-gray-500 font-medium">Item Name</span>
              <p className="text-sm font-semibold text-gray-900 mt-1">{data.item.name}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium">Item Code</span>
              <p className="text-sm font-semibold text-gray-900 mt-1">{data.item.code}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium">Store</span>
              <p className="text-sm font-semibold text-gray-900 mt-1">{data.store.name}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium">Tracking Type</span>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                  {data.tracking_type_display}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-600 font-medium uppercase tracking-wide">Total In Use</div>
              <div className="text-3xl font-bold text-slate-700 mt-1">{data.total_in_use_quantity}</div>
              <div className="text-xs text-slate-500 mt-1">units currently in use</div>
            </div>
            <div className="bg-slate-200 rounded-full p-3">
              <Package className="w-8 h-8 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Locations</div>
              <div className="text-3xl font-bold text-blue-700 mt-1">{data.non_store_count}</div>
              <div className="text-xs text-blue-500 mt-1">non-store locations</div>
            </div>
            <div className="bg-blue-200 rounded-full p-3">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Non-Store Locations List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Distribution by Location</h2>
        </div>

        {data.non_store_count === 0 ? (
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-blue-100 rounded-full p-4 mb-3">
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">No items currently in use</p>
              <p className="text-xs text-gray-500 mt-1">Items at non-store locations will appear here</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data.non_store_locations.map((location) => (
              <div key={location.location_id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleLocation(location.location_id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {expandedLocations[location.location_id] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{location.location_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getLocationTypeBadgeColor(location.location_type)}`}>
                          {location.location_type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-700">{location.quantity}</div>
                    <div className="text-xs text-gray-500">units</div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedLocations[location.location_id] && (
                  <div className="mt-3 ml-10 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {data.tracking_type === 'INDIVIDUAL' && location.instances && location.instances.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Instances</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead className="bg-gray-100 border-b border-gray-200">
                              <tr>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Instance Code</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {location.instances.map((inst) => (
                                <tr key={inst.id} className="hover:bg-gray-100 transition-colors">
                                  <td className="py-2 px-3 font-medium text-gray-900">{inst.instance_code}</td>
                                  <td className="py-2 px-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                      {inst.current_status_display}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {data.tracking_type !== 'INDIVIDUAL' && location.allocations && location.allocations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Allocations</h4>
                        <div className="space-y-2">
                          {location.allocations.map((alloc, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 px-3 bg-white rounded border border-gray-200">
                              <div>
                                <span className="text-xs font-medium text-gray-900">{alloc.stock_source_identifier}</span>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Current: {alloc.current_quantity} | In Use: {alloc.in_use_quantity}
                                </div>
                              </div>
                              <span className="text-sm font-bold text-slate-700">{alloc.in_use_quantity} units</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InUseDistribution;
