import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Package, Calendar, Layers, Loader } from 'lucide-react';

// API client (adjust the base URL as needed)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = {
  get: async (url) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  }
};

const InspectionItemModal = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    item: '',
    item_name: '',
    tendered_quantity: 0,
    delivered_quantity: 0,
    accepted_quantity: 0,
    rejected_quantity: 0,
    unit_price: '',
    specifications: '',
    // NEW: Dynamic attributes based on item type
    batch_number: '',
    manufacture_date: '',
    expiry_date: '',
    shelf_life_days: '',
    manufacturer: '',
    brand: '',
    model: '',
    serial_number: '',
    warranty_months: '',
    additional_attributes: {}
  });

  const [loading, setLoading] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (item) {
      setFormData({
        item: item.item || '',
        item_name: item.item_name || '',
        tendered_quantity: item.tendered_quantity || item.ordered_quantity || 0,
        delivered_quantity: item.delivered_quantity || 0,
        accepted_quantity: item.accepted_quantity || 0,
        rejected_quantity: item.rejected_quantity || 0,
        unit_price: item.unit_price || '',
        specifications: item.specifications || '',
        // Populate dynamic fields if they exist
        batch_number: item.batch_number || '',
        manufacture_date: item.manufacture_date || '',
        expiry_date: item.expiry_date || '',
        shelf_life_days: item.shelf_life_days || '',
        manufacturer: item.manufacturer || '',
        brand: item.brand || '',
        model: item.model || '',
        serial_number: item.serial_number || '',
        warranty_months: item.warranty_months || '',
        additional_attributes: item.additional_attributes || {}
      });

      // Find and set item details
      if (items && items.length > 0 && item.item) {
        const itemDetail = items.find(i => i.id === parseInt(item.item));
        if (itemDetail) {
          setSelectedItemDetails(itemDetail);
        }
      }
    }
  }, [item, items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'item') {
      const selectedItem = items.find(i => i.id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        item: value,
        item_name: selectedItem ? selectedItem.name : ''
      }));
      setSelectedItemDetails(selectedItem);
      setValidationErrors({});
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAdditionalAttributeChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      additional_attributes: {
        ...prev.additional_attributes,
        [key]: value
      }
    }));
  };

  const calculateExpiryDate = () => {
    if (formData.manufacture_date && formData.shelf_life_days) {
      const mfgDate = new Date(formData.manufacture_date);
      const shelfLife = parseInt(formData.shelf_life_days);
      if (!isNaN(shelfLife)) {
        const expiryDate = new Date(mfgDate);
        expiryDate.setDate(expiryDate.getDate() + shelfLife);
        return expiryDate.toISOString().split('T')[0];
      }
    }
    return '';
  };

  useEffect(() => {
    // Auto-calculate expiry date when manufacture date or shelf life changes
    if (formData.manufacture_date && formData.shelf_life_days) {
      const calculatedExpiry = calculateExpiryDate();
      if (calculatedExpiry && calculatedExpiry !== formData.expiry_date) {
        setFormData(prev => ({
          ...prev,
          expiry_date: calculatedExpiry
        }));
      }
    }
  }, [formData.manufacture_date, formData.shelf_life_days]);

  const validateForm = () => {
    const errors = {};
    
    // Basic validation
    const tendered = parseInt(formData.tendered_quantity) || 0;
    const delivered = parseInt(formData.delivered_quantity) || 0;
    const accepted = parseInt(formData.accepted_quantity) || 0;
    const rejected = parseInt(formData.rejected_quantity) || 0;
    
    if (accepted + rejected > tendered) {
      errors.quantities = 'Accepted + Rejected cannot exceed Tendered quantity';
    }

    if (!selectedItemDetails) {
      errors.item = 'Please select an item';
      setValidationErrors(errors);
      return false;
    }

    const trackingType = selectedItemDetails.category_tracking_type;
    
    // BATCH tracking validation (Perishables)
    if (trackingType === 'BATCH') {
      if (accepted > 0) {
        if (!formData.batch_number) {
          errors.batch_number = 'Batch number required for perishable items';
        }
        if (!formData.expiry_date) {
          errors.expiry_date = 'Expiry date required for perishable items';
        }
        if (!formData.manufacture_date) {
          errors.manufacture_date = 'Manufacture date required for perishable items';
        }
        if (!formData.manufacturer) {
          errors.manufacturer = 'Manufacturer/Supplier required for perishable items';
        }
      }
    }
    
    // BULK tracking validation (Consumables)
    if (trackingType === 'BULK') {
      if (accepted > 0) {
        if (!formData.batch_number) {
          errors.batch_number = 'Batch/Lot number required for consumables';
        }
        if (!formData.manufacturer) {
          errors.manufacturer = 'Manufacturer/Supplier required for consumables';
        }
      }
    }
    
    // INDIVIDUAL tracking validation (Fixed Assets)
    if (trackingType === 'INDIVIDUAL') {
      if (accepted > 0) {
        if (!formData.brand) {
          errors.brand = 'Brand required for fixed assets';
        }
        if (!formData.model) {
          errors.model = 'Model required for fixed assets';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Prepare data based on tracking type
    const submitData = {
      item: formData.item,
      item_name: formData.item_name,
      tendered_quantity: parseInt(formData.tendered_quantity) || 0,
      delivered_quantity: parseInt(formData.delivered_quantity) || 0,
      accepted_quantity: parseInt(formData.accepted_quantity) || 0,
      rejected_quantity: parseInt(formData.rejected_quantity) || 0,
      unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
      specifications: formData.specifications
    };

    // Add tracking-specific fields
    const trackingType = selectedItemDetails?.category_tracking_type;
    
    if (trackingType === 'BATCH' || trackingType === 'BULK') {
      submitData.batch_number = formData.batch_number;
      submitData.manufacture_date = formData.manufacture_date;
      submitData.manufacturer = formData.manufacturer;
      submitData.brand = formData.brand;
      
      if (trackingType === 'BATCH') {
        submitData.expiry_date = formData.expiry_date;
        submitData.shelf_life_days = formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null;
      }
    }
    
    if (trackingType === 'INDIVIDUAL') {
      submitData.brand = formData.brand;
      submitData.model = formData.model;
      submitData.serial_number = formData.serial_number;
      submitData.warranty_months = formData.warranty_months ? parseInt(formData.warranty_months) : null;
    }

    // Add any additional custom attributes
    if (Object.keys(formData.additional_attributes).length > 0) {
      submitData.additional_attributes = formData.additional_attributes;
    }
    
    onSave(submitData);
  };

  const renderTrackingTypeIcon = () => {
    if (!selectedItemDetails) return null;
    
    const trackingType = selectedItemDetails.category_tracking_type;
    const icons = {
      'INDIVIDUAL': <Package className="w-4 h-4 text-blue-600" />,
      'BULK': <Layers className="w-4 h-4 text-green-600" />,
      'BATCH': <Calendar className="w-4 h-4 text-orange-600" />
    };
    
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        {icons[trackingType]}
        <div>
          <p className="text-xs font-medium text-gray-900">
            {selectedItemDetails.category_tracking_type_display}
          </p>
          <p className="text-xs text-gray-500">
            {trackingType === 'INDIVIDUAL' && 'Each item tracked individually'}
            {trackingType === 'BULK' && 'Tracked in bulk quantities'}
            {trackingType === 'BATCH' && 'FIFO tracking with expiry dates'}
          </p>
        </div>
      </div>
    );
  };

  const renderDynamicFields = () => {
    if (!selectedItemDetails) return null;
    
    const trackingType = selectedItemDetails.category_tracking_type;
    
    return (
      <div className="space-y-3 border-t border-gray-200 pt-3">
        <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-primary-600" />
          Item-Specific Details
        </h4>

        {/* BATCH tracking fields (Perishables like KMnO4) */}
        {trackingType === 'BATCH' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Batch Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleChange}
                  className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.batch_number 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                  placeholder="e.g., BATCH-2024-001"
                />
                {validationErrors.batch_number && (
                  <p className="text-xs text-red-600 mt-0.5">{validationErrors.batch_number}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Manufacturer/Supplier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.manufacturer 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                  placeholder="e.g., Merck, Sigma"
                />
                {validationErrors.manufacturer && (
                  <p className="text-xs text-red-600 mt-0.5">{validationErrors.manufacturer}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Manufacture Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="manufacture_date"
                  value={formData.manufacture_date}
                  onChange={handleChange}
                  className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.manufacture_date 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                />
                {validationErrors.manufacture_date && (
                  <p className="text-xs text-red-600 mt-0.5">{validationErrors.manufacture_date}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Shelf Life (Days)
                </label>
                <input
                  type="number"
                  name="shelf_life_days"
                  value={formData.shelf_life_days}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 30, 40, 90"
                />
                <p className="text-xs text-gray-500 mt-0.5">Varies by supplier</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                  validationErrors.expiry_date 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-primary-500'
                }`}
              />
              {validationErrors.expiry_date && (
                <p className="text-xs text-red-600 mt-0.5">{validationErrors.expiry_date}</p>
              )}
              {formData.manufacture_date && formData.shelf_life_days && (
                <p className="text-xs text-green-600 mt-0.5">
                  ✓ Auto-calculated from manufacture date + shelf life
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Brand (Optional)
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Merck Grade, Technical Grade"
              />
            </div>
          </>
        )}

        {/* BULK tracking fields (Consumables) */}
        {trackingType === 'BULK' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Batch/Lot Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleChange}
                  className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.batch_number 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                  placeholder="e.g., LOT-2024-A"
                />
                {validationErrors.batch_number && (
                  <p className="text-xs text-red-600 mt-0.5">{validationErrors.batch_number}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Manufacturer/Supplier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.manufacturer 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                  placeholder="e.g., ABC Stationery"
                />
                {validationErrors.manufacturer && (
                  <p className="text-xs text-red-600 mt-0.5">{validationErrors.manufacturer}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Parker, Pilot"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Manufacture Date (Optional)
                </label>
                <input
                  type="date"
                  name="manufacture_date"
                  value={formData.manufacture_date}
                  onChange={handleChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </>
        )}

        {/* INDIVIDUAL tracking fields (Fixed Assets like Core i5) */}
        {trackingType === 'INDIVIDUAL' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.brand 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                  placeholder="e.g., Dell, HP, Lenovo"
                />
                {validationErrors.brand && (
                  <p className="text-xs text-red-600 mt-0.5">{validationErrors.brand}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className={`w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.model 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                  placeholder="e.g., Core i5-12400, Latitude 5420"
                />
                {validationErrors.model && (
                  <p className="text-xs text-red-600 mt-0.5">{validationErrors.model}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Manufacturer (Optional)
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Intel, AMD"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Serial Number (Optional)
                </label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="If available at this stage"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Warranty (Months) (Optional)
              </label>
              <input
                type="number"
                name="warranty_months"
                value={formData.warranty_months}
                onChange={handleChange}
                min="1"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 12, 24, 36"
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">
            {item ? 'Edit Item' : 'Add Item'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Item Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Select Item <span className="text-red-500">*</span>
            </label>
            <select
              name="item"
              value={formData.item}
              onChange={handleChange}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={loading}
            >
              <option value="">Select an item</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.code}) - {item.category_tracking_type_display}
                </option>
              ))}
            </select>
          </div>

          {/* Show tracking type info */}
          {selectedItemDetails && renderTrackingTypeIcon()}

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Tendered Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="tendered_quantity"
                value={formData.tendered_quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-0.5">Ordered quantity</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Delivered Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="delivered_quantity"
                value={formData.delivered_quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-0.5">Actually delivered</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Accepted Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="accepted_quantity"
                value={formData.accepted_quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-2 py-1 text-xs border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="text-xs text-gray-500 mt-0.5">Good quality items</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Rejected Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="rejected_quantity"
                value={formData.rejected_quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-2 py-1 text-xs border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <p className="text-xs text-gray-500 mt-0.5">Defective items</p>
            </div>
          </div>

          {/* Validation Message */}
          {validationErrors.quantities && (
            <div className="bg-red-50 border border-red-200 p-2 rounded-lg">
              <p className="text-xs text-red-800">⚠ {validationErrors.quantities}</p>
            </div>
          )}

          {/* Unit Price */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Unit Price (PKR)
            </label>
            <input
              type="number"
              name="unit_price"
              value={formData.unit_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
          </div>

          {/* Dynamic fields based on tracking type */}
          {renderDynamicFields()}

          {/* Specifications */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Specifications / Remarks
            </label>
            <textarea
              name="specifications"
              value={formData.specifications}
              onChange={handleChange}
              rows="3"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Any specific details about this item..."
            />
          </div>

          {/* Calculated Total */}
          {formData.unit_price && formData.accepted_quantity > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Total Value:</strong> Rs. {(parseFloat(formData.unit_price) * parseInt(formData.accepted_quantity)).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {/* Info box about dynamic fields */}
          {selectedItemDetails && (
            <div className="bg-primary-50 border border-primary-200 p-2 rounded-lg">
              <p className="text-xs text-primary-800">
                <strong>ℹ️ Note:</strong> {' '}
                {selectedItemDetails.category_tracking_type === 'BATCH' && 
                  'This is a perishable item. Batch number, manufacture date, expiry date, and supplier details are required. Shelf life may vary by supplier (e.g., 30 days from one vendor, 40 days from another).'}
                {selectedItemDetails.category_tracking_type === 'BULK' && 
                  'This is a consumable item. Batch/lot number and supplier details help track different procurements with varying quality.'}
                {selectedItemDetails.category_tracking_type === 'INDIVIDUAL' && 
                  'This is a fixed asset. Brand and model details distinguish between different variants (e.g., Core i5 from different manufacturers).'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {item ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InspectionItemModal;