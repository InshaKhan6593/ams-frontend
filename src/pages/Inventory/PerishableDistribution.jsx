// src/pages/Inventory/PerishableDistribution.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, AlertCircle, Calendar, AlertTriangle } from 'lucide-react';
import { perishablesAPI } from '../../api/inventory';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PerishableDistribution = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDistribution();
  }, [itemId]);

  const fetchDistribution = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await perishablesAPI.getItemDistribution(itemId);
      setData(result);
    } catch (err) {
      console.error('Error fetching distribution:', err);
      setError(err.response?.data?.error || 'Failed to load item distribution');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getBatchStatusColor = (batch) => {
    if (batch.is_expired) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (batch.is_near_expiry) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-green-50 text-green-700 border-green-200';
  };

  const getBatchStatusLabel = (batch) => {
    if (batch.is_expired) return 'Expired';
    if (batch.is_near_expiry) return 'Near Expiry';
    return 'Fresh';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </button>
      </div>

      {/* Item Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Package className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-gray-900">{data.item?.name}</h1>
            <p className="text-xs text-gray-500 font-mono">{data.item?.code}</p>
            {data.item?.category_name && (
              <p className="text-xs text-gray-500 mt-0.5">{data.item.category_name}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">{data.total_quantity}</p>
            <p className="text-xs text-gray-500">{data.item?.unit || 'units'} total</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">Total Qty</p>
          <p className="text-base font-bold text-gray-900">{data.total_quantity}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-base font-bold text-green-600">{data.available_quantity}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">Reserved</p>
          <p className="text-base font-bold text-amber-600">{data.reserved_quantity}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">Batches</p>
          <p className="text-base font-bold text-slate-600">{data.total_batches}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">Near Expiry</p>
          <p className="text-base font-bold text-amber-600">{data.near_expiry_batches}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">Expired</p>
          <p className="text-base font-bold text-red-600">{data.expired_batches}</p>
        </div>
      </div>

      {/* Store Distribution */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-gray-700 px-1">
          Distribution across {data.store_count} store{data.store_count !== 1 ? 's' : ''}
        </h2>

        {data.store_distribution?.map((store) => (
          <div key={store.store_id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Store Header */}
            <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-900">{store.store_name}</span>
                {store.store_code && (
                  <span className="text-xs text-gray-500 font-mono">({store.store_code})</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600 font-medium">{store.available_quantity} available</span>
                <span className="font-bold text-gray-700">{store.batch_count} batches</span>
              </div>
            </div>

            {/* Batches Table */}
            {store.batches && store.batches.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Batch #</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Expiry Date</th>
                      <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Status</th>
                      <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-600">Current</th>
                      <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-600">Available</th>
                      <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-600">Reserved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {store.batches.map((batch) => (
                      <tr key={batch.batch_id} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5">
                          <span className="text-xs font-mono text-gray-900">{batch.batch_number}</span>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {formatDate(batch.expiry_date)}
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded border ${getBatchStatusColor(batch)}`}>
                            {batch.is_expired && <AlertCircle className="w-3 h-3" />}
                            {batch.is_near_expiry && !batch.is_expired && <AlertTriangle className="w-3 h-3" />}
                            {getBatchStatusLabel(batch)}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <span className="text-xs font-medium text-gray-900">{batch.current_quantity}</span>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <span className="text-xs text-green-600 font-medium">{batch.available_quantity}</span>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <span className={`text-xs ${batch.reserved_quantity > 0 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                            {batch.reserved_quantity || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {(!data.store_distribution || data.store_distribution.length === 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No batches found in accessible stores</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerishableDistribution;
