// src/api/inventory.js
import apiClient from './client';

export const inventoryAPI = {
  // Get all location inventory
  getAll: async (params = {}) => {
    const response = await apiClient.get('/location-inventory/', { params });
    return response.data;
  },

  // Get single inventory record
  get: async (id) => {
    const response = await apiClient.get(`/location-inventory/${id}/`);
    return response.data;
  },

  // Get inventory for specific location
  getByLocation: async (locationId, params = {}) => {
    const response = await apiClient.get(`/location-inventory/`, {
      params: { location: locationId, ...params }
    });
    return response.data;
  },

  // Get inventory for specific item
  getByItem: async (itemId, params = {}) => {
    const response = await apiClient.get(`/location-inventory/`, {
      params: { item: itemId, ...params }
    });
    return response.data;
  },

  // Get low stock items
  getLowStock: async (params = {}) => {
    const response = await apiClient.get(`/location-inventory/`, {
      params: { low_stock: 'true', ...params }
    });
    return response.data;
  },
};

// Fixed Assets (INDIVIDUAL tracking) API
export const fixedAssetsAPI = {
  // Get aggregated inventory - items grouped by item (not location)
  getAggregated: async (params = {}) => {
    const response = await apiClient.get('/item-instances/aggregated_inventory/', { params });
    return response.data;
  },

  // Get distribution of a specific item across stores
  getItemDistribution: async (itemId, params = {}) => {
    const response = await apiClient.get('/item-instances/item_distribution/', {
      params: { item_id: itemId, ...params }
    });
    return response.data;
  },

  // Get all instances (original API)
  getAll: async (params = {}) => {
    const response = await apiClient.get('/item-instances/', { params });
    return response.data;
  },

  // Get single instance
  get: async (id) => {
    const response = await apiClient.get(`/item-instances/${id}/`);
    return response.data;
  },

  // Update non-crucial instance details (serial_number, asset_tag, condition, notes, etc.)
  updateDetails: async (instanceId, data) => {
    const response = await apiClient.patch(`/item-instances/${instanceId}/update_details/`, data);
    return response.data;
  },
};

// Consumables (BULK tracking) API
export const consumablesAPI = {
  // Get aggregated inventory - items grouped by item (not location)
  getAggregated: async (params = {}) => {
    const response = await apiClient.get('/consumable-inventory/aggregated_inventory/', { params });
    return response.data;
  },

  // Get distribution of a specific item across stores
  getItemDistribution: async (itemId, params = {}) => {
    const response = await apiClient.get('/consumable-inventory/item_distribution/', {
      params: { item_id: itemId, ...params }
    });
    return response.data;
  },

  // Get location-based inventory (original)
  getLocationInventory: async (params = {}) => {
    const response = await apiClient.get('/consumable-inventory/location_inventory/', { params });
    return response.data;
  },

  // Get all consumables
  getAll: async (params = {}) => {
    const response = await apiClient.get('/consumable-inventory/', { params });
    return response.data;
  },

  // Get low stock consumables
  getLowStock: async (params = {}) => {
    const response = await apiClient.get('/consumable-inventory/low_stock/', { params });
    return response.data;
  },
};

// Perishables (BATCH tracking) API
export const perishablesAPI = {
  // Get aggregated inventory - items grouped by item (not location)
  getAggregated: async (params = {}) => {
    const response = await apiClient.get('/item-batches/aggregated_inventory/', { params });
    return response.data;
  },

  // Get distribution of a specific item across stores
  getItemDistribution: async (itemId, params = {}) => {
    const response = await apiClient.get('/item-batches/item_distribution/', {
      params: { item_id: itemId, ...params }
    });
    return response.data;
  },

  // Get location-based inventory (original)
  getLocationInventory: async (params = {}) => {
    const response = await apiClient.get('/item-batches/location_inventory/', { params });
    return response.data;
  },

  // Get all batches
  getAll: async (params = {}) => {
    const response = await apiClient.get('/item-batches/', { params });
    return response.data;
  },

  // Get expiry alerts
  getExpiryAlerts: async (params = {}) => {
    const response = await apiClient.get('/item-batches/expiry_alerts/', { params });
    return response.data;
  },
};

export default inventoryAPI;