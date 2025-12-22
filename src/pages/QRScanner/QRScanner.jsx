// src/pages/QRScanner/QRScanner.jsx - FINAL FIXED VERSION
import { useState } from 'react';
import { 
  QrCode, Search, Download, RefreshCw, MapPin, Package, 
  Calendar, TrendingDown, Wrench, AlertCircle, CheckCircle,
  Clock, User, FileText, ArrowRight, Building2, Info, DollarSign
} from 'lucide-react';

const QRScanner = () => {
  const [scanInput, setScanInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    e.preventDefault();
    
    if (!scanInput.trim()) {
      setError('Please enter an instance code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/item-instances/scan_by_code/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ code: scanInput.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scan code');
      }

      const data = await response.json();
      console.log('Scanned data:', data); // For debugging
      setScannedData(data);
      setError('');
    } catch (err) {
      setError(err.message);
      setScannedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!scannedData) return;
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/item-instances/${scannedData.instance.id}/regenerate_qr/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to regenerate QR code');

      const data = await response.json();
      
      setScannedData(prev => ({
        ...prev,
        instance: {
          ...prev.instance,
          qr_code_image: data.qr_code_image,
          qr_generated: true
        }
      }));
      
      alert('QR code regenerated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadQR = () => {
    if (!scannedData?.instance?.qr_code_image) {
      alert('No QR code available to download');
      return;
    }

    try {
      // Create a link element
      const link = document.createElement('a');
      link.href = scannedData.instance.qr_code_image;
      link.download = `QR_${scannedData.instance.instance_code}.png`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download QR code');
    }
  };

  const handlePrintQR = () => {
    if (!scannedData) return;

    const printWindow = window.open('', '_blank');
    const instance = scannedData.instance;
    const lifecycle = scannedData.lifecycle;
    const depreciation = scannedData.depreciation;
    const maintenance = scannedData.maintenance;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${instance.instance_code}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            font-size: 10px;
          }
          .container {
            max-width: 400px;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 15px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .qr-section {
            text-align: center;
            margin: 15px 0;
          }
          .qr-section img {
            width: 200px;
            height: 200px;
          }
          .info-section {
            margin: 10px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px dotted #ccc;
          }
          .info-label {
            font-weight: bold;
            width: 45%;
          }
          .info-value {
            width: 55%;
            text-align: right;
          }
          .section-title {
            font-weight: bold;
            font-size: 11px;
            margin: 10px 0 5px 0;
            padding: 3px 5px;
            background: #f0f0f0;
            border-left: 3px solid #000;
          }
          @media print {
            body { padding: 0; }
            .container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="font-size: 16px; margin-bottom: 5px;">FIXED ASSET QR CODE</h1>
            <p style="font-size: 12px; font-weight: bold;">${instance.instance_code}</p>
          </div>

          <div class="qr-section">
            <img src="${instance.qr_code_image}" alt="QR Code" />
          </div>

          <div class="section-title">ASSET DETAILS</div>
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Item Name:</span>
              <span class="info-value">${instance.item.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Item Code:</span>
              <span class="info-value">${instance.item.code}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Category:</span>
              <span class="info-value">${instance.item.category || 'N/A'}</span>
            </div>
            ${instance.item.specifications ? `
            <div class="info-row">
              <span class="info-label">Specifications:</span>
              <span class="info-value">${instance.item.specifications}</span>
            </div>
            ` : ''}
          </div>

          <div class="section-title">CURRENT STATUS</div>
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value">${lifecycle.current.status_display}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Condition:</span>
              <span class="info-value">${lifecycle.current.condition_display}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Current Location:</span>
              <span class="info-value">${lifecycle.current.location}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Owner:</span>
              <span class="info-value">${lifecycle.current.owner}</span>
            </div>
          </div>

          ${depreciation && depreciation.has_depreciation_data ? `
          <div class="section-title">DEPRECIATION</div>
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Purchase Value:</span>
              <span class="info-value">PKR ${depreciation.purchase_value?.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Current Value:</span>
              <span class="info-value">PKR ${depreciation.current_book_value?.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Depreciation:</span>
              <span class="info-value">${depreciation.depreciation_percentage}%</span>
            </div>
            <div class="info-row">
              <span class="info-label">Rate:</span>
              <span class="info-value">${depreciation.depreciation_rate}% per year</span>
            </div>
          </div>
          ` : ''}

          ${maintenance ? `
          <div class="section-title">MAINTENANCE</div>
          <div class="info-section">
            ${maintenance.last_maintenance_date ? `
            <div class="info-row">
              <span class="info-label">Last Maintenance:</span>
              <span class="info-value">${new Date(maintenance.last_maintenance_date).toLocaleDateString()}</span>
            </div>
            ` : ''}
            ${maintenance.next_maintenance_date ? `
            <div class="info-row">
              <span class="info-label">Next Maintenance:</span>
              <span class="info-value">${new Date(maintenance.next_maintenance_date).toLocaleDateString()}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}

          ${lifecycle.created.inspection_certificate ? `
          <div class="section-title">INSPECTION</div>
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Certificate No:</span>
              <span class="info-value">${lifecycle.created.inspection_certificate}</span>
            </div>
          </div>
          ` : ''}

          <div style="margin-top: 15px; text-align: center; font-size: 9px; color: #666;">
            <p>Printed on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    return `Rs. ${parseFloat(value).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PK');
  };

  const getStatusColor = (status) => {
    const colors = {
      'IN_STORE': 'bg-green-50 text-green-700 border-green-200',
      'ISSUED': 'bg-blue-50 text-blue-700 border-blue-200',
      'IN_TRANSIT': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'DAMAGED': 'bg-red-50 text-red-700 border-red-200',
      'UNDER_REPAIR': 'bg-orange-50 text-orange-700 border-orange-200',
      'RETIRED': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getConditionColor = (condition) => {
    const colors = {
      'EXCELLENT': 'bg-green-50 text-green-700',
      'GOOD': 'bg-blue-50 text-blue-700',
      'FAIR': 'bg-yellow-50 text-yellow-700',
      'POOR': 'bg-orange-50 text-orange-700',
      'DAMAGED': 'bg-red-50 text-red-700'
    };
    return colors[condition] || 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div>
        <h1 className="text-sm font-bold text-gray-900">QR Code Scanner</h1>
        <p className="text-xs text-gray-600 mt-0.5">
          Scan or search for fixed assets to view details and generate QR codes
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <form onSubmit={handleScan} className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Instance Code
            </label>
            <div className="flex gap-1">
              <div className="relative flex-1">
                <QrCode className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Enter or scan instance code (e.g., INST-2024-0001)"
                  className="w-full pl-8 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-3 h-3" />
                    Scan
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </form>
      </div>

      {/* Scanned Data Display */}
      {scannedData && (
        <div className="space-y-2">
          {/* QR Code and Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* QR Code */}
              <div className="md:col-span-1 flex flex-col items-center justify-center border border-gray-200 rounded p-2 bg-gray-50">
                {scannedData.instance.qr_code_image ? (
                  <>
                    <img
                      src={scannedData.instance.qr_code_image}
                      alt="QR Code"
                      className="w-32 h-32 mb-2"
                    />
                    <p className="text-[10px] text-gray-600 text-center mb-2 font-mono font-bold">
                      {scannedData.instance.instance_code}
                    </p>
                    <div className="flex gap-1 flex-wrap justify-center">
                      <button
                        onClick={handleGenerateQR}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] hover:bg-blue-700 flex items-center gap-1"
                        title="Regenerate QR Code"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regenerate
                      </button>
                      <button
                        onClick={handleDownloadQR}
                        className="px-2 py-1 bg-green-600 text-white rounded text-[10px] hover:bg-green-700 flex items-center gap-1"
                        title="Download QR Code"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                      <button
                        onClick={handlePrintQR}
                        className="px-2 py-1 bg-purple-600 text-white rounded text-[10px] hover:bg-purple-700 flex items-center gap-1"
                        title="Print QR Label"
                      >
                        <FileText className="w-3 h-3" />
                        Print
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">No QR Code</p>
                    <button
                      onClick={handleGenerateQR}
                      className="px-2 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700"
                    >
                      Generate QR Code
                    </button>
                  </div>
                )}
              </div>

              {/* Basic Details */}
              <div className="md:col-span-2 space-y-2">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    Asset Information
                  </h3>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <div>
                      <p className="text-gray-600">Item Name</p>
                      <p className="font-medium text-gray-900">{scannedData.instance.item.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Item Code</p>
                      <p className="font-medium text-gray-900 font-mono">{scannedData.instance.item.code}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Category</p>
                      <p className="font-medium text-gray-900">{scannedData.instance.item.category || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tracking Type</p>
                      <p className="font-medium text-gray-900">{scannedData.instance.item.tracking_type}</p>
                    </div>
                  </div>
                  {scannedData.instance.item.specifications && (
                    <div className="mt-1">
                      <p className="text-gray-600 text-[10px]">Specifications</p>
                      <p className="font-medium text-gray-900 text-[10px]">{scannedData.instance.item.specifications}</p>
                    </div>
                  )}
                </div>

                {/* Status and Condition Badges */}
                <div className="flex gap-1 flex-wrap">
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(scannedData.lifecycle.current.status)}`}>
                    {scannedData.lifecycle.current.status_display}
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getConditionColor(scannedData.lifecycle.current.condition)}`}>
                    {scannedData.lifecycle.current.condition_display}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Status Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <h3 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Current Status
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-start gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">{scannedData.lifecycle.current.location}</p>
                  <p className="text-gray-500 text-[9px]">{scannedData.lifecycle.current.location_full_path}</p>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-600">Owner Location</p>
                  <p className="font-medium text-gray-900">{scannedData.lifecycle.current.owner}</p>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">{formatDate(scannedData.lifecycle.created.date)}</p>
                  <p className="text-gray-500 text-[9px]">by {scannedData.lifecycle.created.by || 'System'}</p>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-600">Age</p>
                  <p className="font-medium text-gray-900">
                    {scannedData.lifecycle.statistics.days_since_creation} days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Depreciation Info */}
          {scannedData.depreciation && scannedData.depreciation.has_depreciation_data && (
            <div className="bg-white rounded-lg border border-gray-200 p-2">
              <h3 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Financial & Depreciation
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                <div>
                  <p className="text-gray-600">Purchase Value</p>
                  <p className="font-medium text-gray-900">{formatCurrency(scannedData.depreciation.purchase_value)}</p>
                  {scannedData.depreciation.purchase_date && (
                    <p className="text-gray-500 text-[9px]">{formatDate(scannedData.depreciation.purchase_date)}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600">Current Book Value</p>
                  <p className="font-medium text-green-700">{formatCurrency(scannedData.depreciation.current_book_value)}</p>
                  {scannedData.depreciation.age_in_years && (
                    <p className="text-gray-500 text-[9px]">{scannedData.depreciation.age_in_years} years old</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600">Accumulated Depreciation</p>
                  <p className="font-medium text-red-700">
                    {formatCurrency(scannedData.depreciation.accumulated_depreciation)}
                    <span className="text-[9px] ml-1">({scannedData.depreciation.depreciation_percentage}%)</span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Depreciation Rate</p>
                  <p className="font-medium text-gray-900">{scannedData.depreciation.depreciation_rate}% per year</p>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Info */}
          {scannedData.maintenance && (
            <div className="bg-white rounded-lg border border-gray-200 p-2">
              <h3 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5" />
                Maintenance Schedule
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px]">
                {scannedData.maintenance.last_maintenance_date && (
                  <div>
                    <p className="text-gray-600">Last Maintenance</p>
                    <p className="font-medium text-gray-900">{formatDate(scannedData.maintenance.last_maintenance_date)}</p>
                  </div>
                )}
                {scannedData.maintenance.next_maintenance_date && (
                  <div>
                    <p className="text-gray-600">Next Maintenance</p>
                    <p className={`font-medium ${scannedData.maintenance.is_overdue ? 'text-red-700' : 'text-gray-900'}`}>
                      {formatDate(scannedData.maintenance.next_maintenance_date)}
                    </p>
                    {scannedData.maintenance.is_overdue && (
                      <p className="text-red-600 text-[9px] flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" />
                        OVERDUE
                      </p>
                    )}
                  </div>
                )}
                {scannedData.maintenance.days_until_maintenance !== null && (
                  <div>
                    <p className="text-gray-600">Days Until Maintenance</p>
                    <p className={`font-medium ${scannedData.maintenance.days_until_maintenance < 30 ? 'text-orange-700' : 'text-gray-900'}`}>
                      {scannedData.maintenance.days_until_maintenance} days
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inspection Certificate */}
          {scannedData.lifecycle.created.inspection_certificate && (
            <div className="bg-white rounded-lg border border-gray-200 p-2">
              <h3 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Inspection Certificate
              </h3>
              <div className="text-[10px]">
                <p className="text-gray-600">Certificate Number</p>
                <p className="font-medium text-gray-900 font-mono">{scannedData.lifecycle.created.inspection_certificate}</p>
              </div>
            </div>
          )}

          {/* Assignment Info */}
          {scannedData.assignment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <h3 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Current Assignment
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <p className="text-blue-700">Assigned To</p>
                  <p className="font-medium text-blue-900">{scannedData.assignment.assigned_to}</p>
                </div>
                <div>
                  <p className="text-blue-700">Assigned Date</p>
                  <p className="font-medium text-blue-900">{formatDate(scannedData.assignment.assigned_date)}</p>
                </div>
                {scannedData.assignment.expected_return_date && (
                  <div>
                    <p className="text-blue-700">Expected Return</p>
                    <p className={`font-medium ${scannedData.assignment.is_overdue ? 'text-red-700' : 'text-blue-900'}`}>
                      {formatDate(scannedData.assignment.expected_return_date)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-blue-700">Duration</p>
                  <p className="font-medium text-blue-900">{scannedData.assignment.days_since_assigned} days</p>
                </div>
              </div>
              {scannedData.assignment.is_overdue && (
                <div className="mt-1 flex items-center gap-1 text-red-700">
                  <AlertCircle className="w-3 h-3" />
                  <p className="text-[10px] font-medium">OVERDUE RETURN</p>
                </div>
              )}
            </div>
          )}

          {/* Pending Transfer */}
          {scannedData.pending_transfer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <h3 className="text-xs font-bold text-yellow-900 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Pending Transfer
              </h3>
              <div className="space-y-1 text-[10px]">
                <div className="flex items-center gap-1">
                  <p className="text-yellow-700 font-medium">{scannedData.pending_transfer.from_location.name}</p>
                  <ArrowRight className="w-3 h-3 text-yellow-600" />
                  <p className="text-yellow-700 font-medium">{scannedData.pending_transfer.to_location.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-yellow-700">Entry Number</p>
                    <p className="font-medium text-yellow-900 font-mono">{scannedData.pending_transfer.entry_number}</p>
                  </div>
                  <div>
                    <p className="text-yellow-700">Days Pending</p>
                    <p className="font-medium text-yellow-900">{scannedData.pending_transfer.days_pending} days</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Repair History */}
          {scannedData.repair_history && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
              <h3 className="text-xs font-bold text-orange-900 mb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5" />
                Repair Information
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {scannedData.repair_history.damage_reported_date && (
                  <div>
                    <p className="text-orange-700">Damage Reported</p>
                    <p className="font-medium text-orange-900">{formatDate(scannedData.repair_history.damage_reported_date)}</p>
                  </div>
                )}
                {scannedData.repair_history.repair_cost && (
                  <div>
                    <p className="text-orange-700">Repair Cost</p>
                    <p className="font-medium text-orange-900">{formatCurrency(scannedData.repair_history.repair_cost)}</p>
                  </div>
                )}
                {scannedData.repair_history.damage_description && (
                  <div className="col-span-2">
                    <p className="text-orange-700">Description</p>
                    <p className="font-medium text-orange-900">{scannedData.repair_history.damage_description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Movement History - CLEAN VERSION */}
          {scannedData.movement_history && scannedData.movement_history.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-2">
              <h3 className="text-xs font-bold text-gray-900 mb-1">Movement History ({scannedData.movement_history.length})</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {scannedData.movement_history.map((movement) => (
                  <div key={movement.id} className="border-l-2 border-gray-300 pl-2 pb-1">
                    <div className="text-[10px]">
                      {/* Movement Type Badge */}
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-900 rounded font-medium">
                          {movement.movement_type_display}
                        </span>
                        {movement.acknowledged && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-medium flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Acknowledged
                          </span>
                        )}
                      </div>
                      
                      {/* Location Flow - Clean display with badges */}
                      {(movement.from_location || movement.to_location) && (
                        <div className="flex items-center gap-1 text-gray-700 mb-0.5 flex-wrap">
                          {movement.from_location && (
                            <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded">
                              {movement.from_location.name}
                            </span>
                          )}
                          {movement.from_location && movement.to_location && (
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                          )}
                          {movement.to_location && (
                            <span className="px-1.5 py-0.5 bg-green-50 border border-green-200 rounded">
                              {movement.to_location.name}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Meta Info */}
                      <div className="flex items-center gap-2 text-gray-500 text-[9px]">
                        <span className="flex items-center gap-0.5">
                          <User className="w-2.5 h-2.5" />
                          {movement.moved_by}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatDate(movement.date)}
                        </span>
                        {movement.stock_entry_number && (
                          <span className="flex items-center gap-0.5 font-mono">
                            #{movement.stock_entry_number}
                          </span>
                        )}
                      </div>
                      
                      {/* Status Change */}
                      {movement.previous_status && movement.new_status && (
                        <div className="text-[9px] text-gray-600 mt-0.5">
                          Status: {movement.previous_status_display} → {movement.new_status_display}
                        </div>
                      )}
                      
                      {/* Remarks - Only show if not empty and not garbage */}
                      {movement.remarks && movement.remarks.trim() && !movement.remarks.includes('Ã') && (
                        <div className="mt-0.5 bg-yellow-50 border border-yellow-200 rounded px-1.5 py-0.5">
                          <p className="text-gray-700 text-[9px]">{movement.remarks}</p>
                        </div>
                      )}
                      
                      {/* Acknowledgment Info */}
                      {movement.acknowledged_by && (
                        <div className="text-[9px] text-green-700 mt-0.5">
                          Acknowledged by {movement.acknowledged_by} on {formatDate(movement.acknowledged_at)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
            <h3 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Quick Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
              <div>
                <p className="text-gray-600">Total Movements</p>
                <p className="font-bold text-gray-900 text-xs">{scannedData.lifecycle.statistics.total_movements}</p>
              </div>
              <div>
                <p className="text-gray-600">Age (Days)</p>
                <p className="font-bold text-gray-900 text-xs">{scannedData.lifecycle.statistics.days_since_creation}</p>
              </div>
              <div>
                <p className="text-gray-600">Available</p>
                <p className={`font-bold text-xs ${scannedData.lifecycle.statistics.is_available ? 'text-green-700' : 'text-red-700'}`}>
                  {scannedData.lifecycle.statistics.is_available ? 'YES' : 'NO'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">In Transit</p>
                <p className={`font-bold text-xs ${scannedData.lifecycle.statistics.is_in_transit ? 'text-yellow-700' : 'text-gray-500'}`}>
                  {scannedData.lifecycle.statistics.is_in_transit ? 'YES' : 'NO'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;