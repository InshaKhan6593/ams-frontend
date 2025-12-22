// src/pages/Inventory/FixedAssetDistribution.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, AlertCircle, Download, QrCode, Edit2, X, Save } from 'lucide-react';
import { fixedAssetsAPI } from '../../api/inventory';
import { qrAPI } from '../../api/qr';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'BEYOND_REPAIR', label: 'Beyond Repair' },
];

const FixedAssetDistribution = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingQR, setDownloadingQR] = useState(null);
  const [editingInstance, setEditingInstance] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    fetchDistribution();
  }, [itemId]);

  const fetchDistribution = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await fixedAssetsAPI.getItemDistribution(itemId);
      setData(result);
    } catch (err) {
      console.error('Error fetching distribution:', err);
      setError(err.response?.data?.error || 'Failed to load item distribution');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = async (instanceCode) => {
    try {
      setDownloadingQR(instanceCode);
      const blob = await qrAPI.downloadQRCode(instanceCode);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_${instanceCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading QR:', err);
    } finally {
      setDownloadingQR(null);
    }
  };

  const handleEditClick = (instance) => {
    setEditingInstance(instance);
    setEditForm({
      serial_number: instance.serial_number || '',
      asset_tag: instance.asset_tag || '',
      condition: instance.condition || 'NEW',
      condition_notes: instance.condition_notes || '',
      notes: instance.notes || '',
      warranty_expiry: instance.warranty_expiry || '',
      maintenance_notes: instance.maintenance_notes || '',
    });
    setEditSuccess('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingInstance) return;

    try {
      setSaving(true);
      setError('');
      await fixedAssetsAPI.updateDetails(editingInstance.id, editForm);
      setEditSuccess('Details updated successfully!');

      // Refresh data after update
      await fetchDistribution();

      // Close modal after short delay
      setTimeout(() => {
        setEditingInstance(null);
        setEditForm({});
        setEditSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Error updating instance:', err);
      setError(err.response?.data?.error || 'Failed to update instance details');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseEdit = () => {
    setEditingInstance(null);
    setEditForm({});
    setEditSuccess('');
    setError('');
  };

  const getStatusColor = (status) => {
    const colors = {
      'IN_STORE': 'bg-green-50 text-green-700 border-green-200',
      'IN_USE': 'bg-slate-50 text-slate-700 border-slate-200',
      'IN_TRANSIT': 'bg-slate-100 text-slate-600 border-slate-200',
      'UNDER_REPAIR': 'bg-amber-50 text-amber-700 border-amber-200',
      'DAMAGED': 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return `Rs. ${parseFloat(value).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
            <p className="text-lg font-bold text-gray-900">{data.total_count}</p>
            <p className="text-xs text-gray-500">total instances</p>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-base font-bold text-gray-900">{data.total_count}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">In Store</p>
          <p className="text-base font-bold text-green-600">{data.in_store}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">In Use</p>
          <p className="text-base font-bold text-slate-600">{data.in_use}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">In Transit</p>
          <p className="text-base font-bold text-slate-500">{data.in_transit}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">Under Repair</p>
          <p className="text-base font-bold text-amber-600">{data.under_repair}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 text-center">
          <p className="text-xs text-gray-500">Damaged</p>
          <p className="text-base font-bold text-red-600">{data.damaged}</p>
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
              <span className="text-xs font-bold text-gray-700">{store.count} instances</span>
            </div>

            {/* Instances Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Instance</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Serial/Tag</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Status</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Condition</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Assigned To</th>
                    <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-600">Value</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {store.instances?.map((instance) => (
                    <tr key={instance.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5">
                        <span className="text-xs font-mono text-gray-900">{instance.instance_code}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="text-xs text-gray-600">
                          {instance.serial_number && <div>SN: {instance.serial_number}</div>}
                          {instance.asset_tag && <div>Tag: {instance.asset_tag}</div>}
                          {!instance.serial_number && !instance.asset_tag && <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded border ${getStatusColor(instance.status)}`}>
                          {instance.status_display}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-xs text-gray-600">{instance.condition_display}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-xs text-gray-600">{instance.assigned_to || '-'}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <span className="text-xs text-gray-600">{formatCurrency(instance.current_book_value)}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditClick(instance)}
                            className="inline-flex items-center p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadQR(instance.instance_code)}
                            disabled={downloadingQR === instance.instance_code}
                            className="inline-flex items-center p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors disabled:opacity-50"
                            title="Download QR Code"
                          >
                            {downloadingQR === instance.instance_code ? (
                              <Download className="w-3.5 h-3.5 animate-pulse" />
                            ) : (
                              <QrCode className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Instance Modal */}
      {editingInstance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Edit Instance Details</h3>
                <p className="text-xs text-gray-500 font-mono">{editingInstance.instance_code}</p>
              </div>
              <button onClick={handleCloseEdit} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {editSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs">
                  {editSuccess}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs text-blue-800">
                  You can update the serial number, asset tag, condition, and notes for this instance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="serial_number"
                    value={editForm.serial_number}
                    onChange={handleEditChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Manufacturer's serial number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Asset Tag
                  </label>
                  <input
                    type="text"
                    name="asset_tag"
                    value={editForm.asset_tag}
                    onChange={handleEditChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Organization's asset tag"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={editForm.condition}
                    onChange={handleEditChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {CONDITION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Warranty Expiry
                  </label>
                  <input
                    type="date"
                    name="warranty_expiry"
                    value={editForm.warranty_expiry}
                    onChange={handleEditChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Condition Notes
                  </label>
                  <textarea
                    name="condition_notes"
                    value={editForm.condition_notes}
                    onChange={handleEditChange}
                    rows="2"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Notes about the current condition..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Maintenance Notes
                  </label>
                  <textarea
                    name="maintenance_notes"
                    value={editForm.maintenance_notes}
                    onChange={handleEditChange}
                    rows="2"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Notes about maintenance..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    General Notes
                  </label>
                  <textarea
                    name="notes"
                    value={editForm.notes}
                    onChange={handleEditChange}
                    rows="2"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedAssetDistribution;
