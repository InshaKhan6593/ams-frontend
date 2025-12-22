// src/api/interStoreRequests.js
import apiClient from './client';

const BASE_URL = '/inter-store-requests';

export const interStoreRequestsAPI = {
  // Get all requests (filtered by user's accessible stores)
  getAll: async () => {
    const response = await apiClient.get(BASE_URL + '/');
    return response.data;
  },

  // Get single request
  get: async (id) => {
    const response = await apiClient.get(`${BASE_URL}/${id}/`);
    return response.data;
  },

  // Alias for get (for compatibility)
  getById: async (id) => {
    const response = await apiClient.get(`${BASE_URL}/${id}/`);
    return response.data;
  },

  // Get outgoing requests (initiated by user's stores)
  getOutgoing: async () => {
    const response = await apiClient.get(`${BASE_URL}/outgoing/`);
    return response.data;
  },

  // Get incoming requests (to be fulfilled by user's stores)
  getIncoming: async () => {
    const response = await apiClient.get(`${BASE_URL}/incoming/`);
    return response.data;
  },

  // Get pending requests (for fulfilling stores)
  getPending: async () => {
    const response = await apiClient.get(`${BASE_URL}/pending/`);
    return response.data;
  },

  // Create new request
  create: async (data) => {
    const response = await apiClient.post(BASE_URL + '/', data);
    return response.data;
  },

  // Update request
  update: async (id, data) => {
    const response = await apiClient.put(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id, data) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  // Delete request
  delete: async (id) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}/`);
    return response.data;
  },

  // Start processing request (for fulfilling store)
  startProcessing: async (id) => {
    const response = await apiClient.post(`${BASE_URL}/${id}/start_processing/`);
    return response.data;
  },

  // Match items to inventory (OLD - kept for backward compatibility)
  matchItems: async (id, matches) => {
    const response = await apiClient.post(`${BASE_URL}/${id}/match_items/`, {
      matches
    });
    return response.data;
  },

  // NEW: Mark item availability (for fulfilling store)
  markAvailability: async (id, items) => {
    const response = await apiClient.post(`${BASE_URL}/${id}/mark_availability/`, {
      items
    });
    return response.data;
  },

  // NEW: Continue to dispatch after marking availability
  continueToDispatch: async (id) => {
    const response = await apiClient.post(`${BASE_URL}/${id}/continue_to_dispatch/`);
    return response.data;
  },

  // Dispatch matched items
  dispatchItems: async (id, dispatches) => {
    const response = await apiClient.post(`${BASE_URL}/${id}/dispatch_items/`, {
      dispatches
    });
    return response.data;
  },

  // Acknowledge or reject received items
  acknowledge: async (id, action, remarks = '') => {
    const response = await apiClient.post(`${BASE_URL}/${id}/acknowledge/`, {
      action,  // 'ACCEPT' or 'REJECT'
      acknowledgment_remarks: remarks
    });
    return response.data;
  },

  // Cancel request
  cancel: async (id) => {
    const response = await apiClient.post(`${BASE_URL}/${id}/cancel/`);
    return response.data;
  },

  // Get available stores for requesting
  getAvailableStores: async () => {
    const response = await apiClient.get('/locations/?is_store=true');
    return response.data;
  },

  // Get items available in a store
  getStoreItems: async (storeId) => {
    const response = await apiClient.get(`/location-inventory/?location=${storeId}`);
    return response.data;
  },

  // Get valid fulfilling stores for a requesting store
  getValidFulfillingStores: async (requestingStoreId) => {
    const response = await apiClient.get(`${BASE_URL}/valid_fulfilling_stores/`, {
      params: { requesting_store: requestingStoreId }
    });
    return response.data;
  },
};