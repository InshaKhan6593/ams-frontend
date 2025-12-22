// src/pages/Inventory/ConsumableDistribution.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, AlertCircle, Calendar } from 'lucide-react';
import { consumablesAPI } from '../../api/inventory';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ConsumableDistribution = () => {
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
      const result = await consumablesAPI.getItemDistribution(itemId);
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

      {/* Quantity Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">Total</p>
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
                <span className="font-bold text-gray-700">{store.total_quantity} total</span>
              </div>
            </div>

            {/* Inventories Table */}
            {store.inventories && store.inventories.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Inventory #</th>
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Received</th>
                      <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-600">Current</th>
                      <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-600">Available</th>
                      <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-600">Reserved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {store.inventories.map((inv) => (
                      <tr key={inv.inventory_id} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5">
                          <span className="text-xs font-mono text-gray-900">{inv.inventory_number}</span>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {formatDate(inv.received_date)}
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <span className="text-xs font-medium text-gray-900">{inv.current_quantity}</span>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <span className="text-xs text-green-600 font-medium">{inv.available_quantity}</span>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <span className={`text-xs ${inv.reserved_quantity > 0 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                            {inv.reserved_quantity || '-'}
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
      </div>
    </div>
  );
};

export default ConsumableDistribution;
