// src/pages/Inspections/InspectionDetails.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Download, Package, MapPin, Calendar, User,
  FileText, CheckCircle, XCircle, AlertCircle, Clock
} from 'lucide-react';
import { inspectionsAPI } from '../../api/inspections';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import InspectionWorkflowProgress from './InspectionWorkflowProgress';

const InspectionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [inspection, setInspection] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInspection();
  }, [id]);

  const fetchInspection = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await inspectionsAPI.get(id);
      console.log('Inspection data loaded:', data);
      setInspection(data);
    } catch (err) {
      console.error('Error loading inspection:', err);
      setError(err.response?.data?.detail || 'Failed to load inspection certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (inspection.stage !== 'COMPLETED') {
      alert('Certificate must be completed to download PDF');
      return;
    }

    try {
      setDownloading(true);
      const response = await inspectionsAPI.downloadPDF(id);

      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inspection-${inspection.contract_no}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to download PDF: ' + (err.response?.data?.error || err.message));
    } finally {
      setDownloading(false);
    }
  };

  const getStageBadge = (stage) => {
    const badges = {
      INITIATED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      STOCK_DETAILS: { bg: 'bg-blue-100', text: 'text-blue-700' },
      CENTRAL_REGISTER: { bg: 'bg-purple-100', text: 'text-purple-700' },
      AUDIT_REVIEW: { bg: 'bg-orange-100', text: 'text-orange-700' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
    };
    const badge = badges[stage] || badges.INITIATED;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {stage?.replace('_', ' ')}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
      IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
      CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    };
    const badge = badges[status] || badges.DRAFT;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-red-800">Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error || 'Inspection not found'}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/inspections')}
          className="mt-3 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-3">
        <button
          onClick={() => navigate('/dashboard/inspections')}
          className="flex items-center text-xs text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to Inspections
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-900">Contract: {inspection.contract_no}</h1>
            <p className="text-xs text-gray-600 mt-0.5">Inspection Certificate Details</p>
          </div>
          <div className="flex items-center gap-2">
            {getStageBadge(inspection.stage)}
            {getStatusBadge(inspection.status)}
            {inspection.stage === 'COMPLETED' && (
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" />
                    Download PDF
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Section */}
      <InspectionWorkflowProgress inspection={inspection} />

      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Contract Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Contract No</p>
              <p className="text-xs font-medium text-gray-900">{inspection.contract_no}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Contract Date</p>
              <p className="text-xs font-medium text-gray-900">
                {inspection.contract_date ? new Date(inspection.contract_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Date of Inspection</p>
              <p className="text-xs font-medium text-gray-900">
                {inspection.date_of_inspection ? new Date(inspection.date_of_inspection).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Finance Check Date</p>
              <p className="text-xs font-medium text-gray-900">
                {inspection.finance_check_date ? new Date(inspection.finance_check_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contractor Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Contractor Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Contractor Name</p>
              <p className="text-xs font-medium text-gray-900">{inspection.contractor_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Address</p>
              <p className="text-xs font-medium text-gray-900">{inspection.contractor_address || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department & Delivery Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Department & Delivery</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Department</p>
              <p className="text-xs font-medium text-gray-900">{inspection.department_name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Indenter</p>
              <p className="text-xs font-medium text-gray-900">{inspection.indenter}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Indent No</p>
              <p className="text-xs font-medium text-gray-900">{inspection.indent_no}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Date of Delivery</p>
              <p className="text-xs font-medium text-gray-900">
                {inspection.date_of_delivery ? new Date(inspection.date_of_delivery).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600">Delivery Type</p>
              <p className="text-xs font-medium text-gray-900">{inspection.delivery_type || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inspection Items */}
      {inspection.inspection_items && inspection.inspection_items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">
            Inspection Items ({inspection.inspection_items.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700">#</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700">Item</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700">Category</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700">Tracking</th>
                  <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-700">Tendered</th>
                  <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-700">Rejected</th>
                  <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-700">Accepted</th>
                  <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">Unit Price</th>
                  <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inspection.inspection_items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-xs text-gray-900">{index + 1}</td>
                    <td className="px-2 py-2 text-xs text-gray-900">
                      {item.item_name || item.item_description || 'N/A'}
                      {item.batch_number && (
                        <span className="block text-xs text-gray-600 mt-0.5">Batch: {item.batch_number}</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-600">{item.item_category_name || 'N/A'}</td>
                    <td className="px-2 py-2 text-xs text-gray-600">{item.item_tracking_type_display || 'N/A'}</td>
                    <td className="px-2 py-2 text-xs text-center text-gray-900">{item.tendered_quantity || 0}</td>
                    <td className="px-2 py-2 text-xs text-center text-red-600">{item.rejected_quantity || 0}</td>
                    <td className="px-2 py-2 text-xs text-center text-green-600">{item.accepted_quantity || 0}</td>
                    <td className="px-2 py-2 text-xs text-right text-gray-900">
                      {item.unit_price ? `Rs. ${parseFloat(item.unit_price).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                    </td>
                    <td className="px-2 py-2 text-xs text-right text-gray-900">
                      {item.unit_price && item.accepted_quantity
                        ? `Rs. ${(parseFloat(item.unit_price) * parseInt(item.accepted_quantity)).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-xs">
            <span className="font-medium text-gray-900">Total Items: {inspection.inspection_items.length}</span>
            <span className="font-medium text-gray-900">
              Total Value: Rs. {inspection.total_value ? parseFloat(inspection.total_value).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
        </div>
      )}

      {/* Consignee Information */}
      {inspection.consignee_name && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">Consignee Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600">Name</p>
                <p className="text-xs font-medium text-gray-900">{inspection.consignee_name}</p>
              </div>
            </div>

            {inspection.consignee_designation && (
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Designation</p>
                  <p className="text-xs font-medium text-gray-900">{inspection.consignee_designation}</p>
                </div>
              </div>
            )}

            {inspection.inspected_by && (
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Inspected By</p>
                  <p className="text-xs font-medium text-gray-900">{inspection.inspected_by}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remarks */}
      {inspection.remarks && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">Remarks</h2>
          <p className="text-xs text-gray-900">{inspection.remarks}</p>
        </div>
      )}
    </div>
  );
};

export default InspectionDetails;
