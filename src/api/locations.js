// src/api/locations.js
import apiClient from './client';

export const locationsAPI = {
  // Get all locations (with alias for consistency) - fetches all pages
  getLocations: async (params = {}) => {
    let allLocations = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await apiClient.get('/locations/', {
        params: { ...params, page: currentPage }
      });
      const data = response.data;

      if (Array.isArray(data)) {
        allLocations = data;
        hasMore = false;
      } else {
        allLocations = [...allLocations, ...(data.results || [])];
        hasMore = !!data.next;
        currentPage++;
      }
    }

    return allLocations;
  },

  getAll: async (params = {}) => {
    return locationsAPI.getLocations(params);
  },

  // Get single location (with alias for consistency)
  getLocation: async (id) => {
    const response = await apiClient.get(`/locations/${id}/`);
    return response.data;
  },
  
  get: async (id) => {
    const response = await apiClient.get(`/locations/${id}/`);
    return response.data;
  },

  // Create location
  createLocation: async (locationData) => {
    const response = await apiClient.post('/locations/', locationData);
    return response.data;
  },
  
  create: async (locationData) => {
    const response = await apiClient.post('/locations/', locationData);
    return response.data;
  },

  // Update location
  updateLocation: async (id, locationData) => {
    const response = await apiClient.put(`/locations/${id}/`, locationData);
    return response.data;
  },
  
  update: async (id, locationData) => {
    const response = await apiClient.put(`/locations/${id}/`, locationData);
    return response.data;
  },
  
  // Patch location
  patch: async (id, locationData) => {
    const response = await apiClient.patch(`/locations/${id}/`, locationData);
    return response.data;
  },

  // Get standalone locations
  getStandaloneLocations: async () => {
    const response = await apiClient.get('/locations/standalone_locations/');
    return response.data;
  },

  // Get store locations
  getStoreLocations: async () => {
    const response = await apiClient.get('/locations/store_locations/');
    return response.data;
  },

  // Get user accessible locations
  getUserAccessibleLocations: async () => {
    const response = await apiClient.get('/locations/user_accessible_locations/');
    return response.data;
  },
};

export default locationsAPI;