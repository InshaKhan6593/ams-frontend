// src/api/maintenance.js
import apiClient from './client';

export const maintenanceAPI = {
  // Get all maintenance records
  getAll: async (params = {}) => {
    const response = await apiClient.get('/maintenance-records/', { params });
    return response.data;
  },

  // Get single maintenance record
  get: async (id) => {
    const response = await apiClient.get(`/maintenance-records/${id}/`);
    return response.data;
  },

  // Get maintenance records for a specific instance
  getByInstance: async (instanceId) => {
    const response = await apiClient.get(`/maintenance-records/`, {
      params: { instance: instanceId }
    });
    return response.data;
  },

  // Create maintenance record
  create: async (maintenanceData) => {
    const response = await apiClient.post('/maintenance-records/', maintenanceData);
    return response.data;
  },

  // Update maintenance record
  update: async (id, maintenanceData) => {
    const response = await apiClient.put(`/maintenance-records/${id}/`, maintenanceData);
    return response.data;
  },

  // Partial update
  patch: async (id, maintenanceData) => {
    const response = await apiClient.patch(`/maintenance-records/${id}/`, maintenanceData);
    return response.data;
  },

  // Delete maintenance record
  delete: async (id) => {
    const response = await apiClient.delete(`/maintenance-records/${id}/`);
    return response.data;
  },

  // Mark maintenance as started
  startMaintenance: async (id, data = {}) => {
    const response = await apiClient.post(`/maintenance-records/${id}/start/`, data);
    return response.data;
  },

  // Mark maintenance as completed
  completeMaintenance: async (id, data) => {
    const response = await apiClient.post(`/maintenance-records/${id}/complete/`, data);
    return response.data;
  },

  // Cancel maintenance
  cancelMaintenance: async (id, data) => {
    const response = await apiClient.post(`/maintenance-records/${id}/cancel/`, data);
    return response.data;
  },
};

export default maintenanceAPI;
