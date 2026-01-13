// src/api/inspections.js
import apiClient from './client';

export const inspectionsAPI = {
  // Get all inspection certificates
  getAll: async (params = {}) => {
    const response = await apiClient.get('/inspection-certificates/', { params });
    return response.data;
  },

  // Get single inspection certificate
  get: async (id) => {
    const response = await apiClient.get(`/inspection-certificates/${id}/`);
    return response.data;
  },

  // Create inspection certificate
  create: async (data) => {
    const response = await apiClient.post('/inspection-certificates/', data);
    return response.data;
  },

  // Update inspection certificate
  update: async (id, data) => {
    const response = await apiClient.put(`/inspection-certificates/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id, data) => {
    const response = await apiClient.patch(`/inspection-certificates/${id}/`, data);
    return response.data;
  },

  // Delete inspection certificate
  delete: async (id) => {
    const response = await apiClient.delete(`/inspection-certificates/${id}/`);
    return response.data;
  },

  // Get creation options (departments dropdown)
  getCreationOptions: async () => {
    const response = await apiClient.get('/inspection-certificates/creation_options/');
    return response.data;
  },

  // Stage 1 → 2/3: Submit to Stock Incharge
  submitToStockIncharge: async (id, data = {}) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/submit_to_stock_incharge/`, data);
    return response.data;
  },

  // Stage 2 → 3: Submit stock details (non-root only)
  submitStockDetails: async (id, data = {}) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/submit_stock_details/`, data);
    return response.data;
  },

  // Stage 2/3 → 3/4: Submit central register
  submitCentralRegister: async (id, data = {}) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/submit_central_register/`, data);
    return response.data;
  },

  // Stage 3/4 → COMPLETED: Submit audit review (Approve)
  submitAuditReview: async (id, data = {}) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/submit_audit_review/`, data);
    return response.data;
  },

  // Alias for backwards compatibility
  approveCertificate: async (id, data = {}) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/submit_audit_review/`, data);
    return response.data;
  },

  // Any stage → REJECTED: Reject
  reject: async (id, reason) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/reject/`, { 
      reason: reason 
    });
    return response.data;
  },

  // Alias for backwards compatibility
  rejectCertificate: async (id, reason) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/reject/`, { 
      reason: reason 
    });
    return response.data;
  },

  // Get unlinked items for CENTRAL_REGISTER stage
  getUnlinkedItems: async (id) => {
    const response = await apiClient.get(`/inspection-certificates/${id}/unlinked_items/`);
    return response.data;
  },

  // Link inspection item to existing system item
  linkToExistingItem: async (id, data) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/link_to_existing_item/`, data);
    return response.data;
  },

  // Create new item and link to inspection item
  createAndLinkItem: async (id, data) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/create_and_link_item/`, data);
    return response.data;
  },

  // Create sub-category on-the-fly during inspection
  createSubCategory: async (id, data) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/create_sub_category/`, data);
    return response.data;
  },

  // Unlink inspection item
  unlinkItem: async (id, data) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/unlink_item/`, data);
    return response.data;
  },

  // Update central register details for linked item
  updateCentralRegisterDetails: async (id, data) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/update_central_register_details/`, data);
    return response.data;
  },

  // Update item stock/maintenance settings during CENTRAL_REGISTER stage
  updateItemStockSettings: async (id, data) => {
    const response = await apiClient.post(`/inspection-certificates/${id}/update_item_stock_settings/`, data);
    return response.data;
  },

  // NEW: Download PDF (only for COMPLETED certificates)
  downloadPDF: async (id) => {
    const response = await apiClient.get(`/inspection-certificates/${id}/download_pdf/`, {
      responseType: 'blob' // Important: tells axios to expect binary data
    });
    return response.data;
  },
};

export default inspectionsAPI;