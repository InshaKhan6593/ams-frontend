// src/api/stockEntries.js
import apiClient from './client';

export const stockEntriesAPI = {
  // List stock entries with filters
  getAll: async (params = {}) => {
    const response = await apiClient.get('/stock-entries/', { params });
    return response.data;
  },

  // Get single stock entry
  get: async (id) => {
    const response = await apiClient.get(`/stock-entries/${id}/`);
    return response.data;
  },

  // Create new stock entry
  create: async (data) => {
    const response = await apiClient.post('/stock-entries/', data);
    return response.data;
  },

  // Update stock entry
  update: async (id, data) => {
    const response = await apiClient.patch(`/stock-entries/${id}/`, data);
    return response.data;
  },

  // Delete stock entry
  delete: async (id) => {
    const response = await apiClient.delete(`/stock-entries/${id}/`);
    return response.data;
  },

  // Get creation options (locations, items, etc.)
  getCreationOptions: async () => {
    const response = await apiClient.get('/stock-entries/create_options/');
    return response.data;
  },

  // Get item stock at a location
  getItemStock: async (fromLocationOrParams, itemId) => {
    // Support both function signatures:
    // getItemStock(fromLocation, itemId) - legacy
    // getItemStock({ from_location, item }) - new object params
    let params;
    if (typeof fromLocationOrParams === 'object') {
      params = fromLocationOrParams;
    } else {
      params = {
        from_location: fromLocationOrParams,
        item: itemId
      };
    }

    console.log('getItemStock API call with params:', params);
    const response = await apiClient.get('/stock-entries/get_item_stock/', { params });
    console.log('getItemStock API response:', response.data);
    return response.data;
  },

  // Get available inventory at a location
  getAvailableInventory: async (params = {}) => {
    const response = await apiClient.get('/location-inventory/', { params });
    return response.data;
  },

  // Get entries created by current user
  getMyEntries: async (params = {}) => {
    const response = await apiClient.get('/stock-entries/my_entries/', { params });
    return response.data;
  },

  // Acknowledge entry (for receiving location)
  acknowledge: async (id) => {
    const response = await apiClient.post(`/stock-entries/${id}/acknowledge/`);
    return response.data;
  },

  // Cancel entry
  cancel: async (id, reason) => {
    const response = await apiClient.post(`/stock-entries/${id}/cancel/`, { reason });
    return response.data;
  },

  // NEW: Acknowledge receipt (for PENDING_ACK entries) - supports both individual and bulk/batch
  acknowledgeReceipt: async (id, data) => {
    const response = await apiClient.post(`/stock-entries/${id}/acknowledge_receipt/`, data);
    return response.data;
  },

  // NEW: Acknowledge return
  acknowledgeReturn: async (id, data) => {
    const response = await apiClient.post(`/stock-entries/${id}/acknowledge_return/`, data);
    return response.data;
  },
};

export default stockEntriesAPI;