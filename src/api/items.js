// src/api/items.js
import apiClient from './client';

export const itemsAPI = {
  // Get all items
  getAll: async (params = {}) => {
    const response = await apiClient.get('/items/', { params });
    return response.data;
  },

  // Get single item
  get: async (id) => {
    const response = await apiClient.get(`/items/${id}/`);
    return response.data;
  },

  // Create item
  create: async (itemData) => {
    const response = await apiClient.post('/items/', itemData);
    return response.data;
  },

  // Update item
  update: async (id, itemData) => {
    const response = await apiClient.put(`/items/${id}/`, itemData);
    return response.data;
  },

  // Partial update item
  patch: async (id, itemData) => {
    const response = await apiClient.patch(`/items/${id}/`, itemData);
    return response.data;
  },

  // Delete item
  delete: async (id) => {
    const response = await apiClient.delete(`/items/${id}/`);
    return response.data;
  },
};

export const categoriesAPI = {
  // Get all categories (supports hierarchical filtering)
  getAll: async (params = {}) => {
    const response = await apiClient.get('/categories/', { params });
    return response.data;
  },

  // Get single category
  get: async (id) => {
    const response = await apiClient.get(`/categories/${id}/`);
    return response.data;
  },

  // Create category (can be broader category or sub-category)
  create: async (categoryData) => {
    const response = await apiClient.post('/categories/', categoryData);
    return response.data;
  },

  // Update category
  update: async (id, categoryData) => {
    const response = await apiClient.put(`/categories/${id}/`, categoryData);
    return response.data;
  },

  // Delete category
  delete: async (id) => {
    const response = await apiClient.delete(`/categories/${id}/`);
    return response.data;
  },

  // Get broader categories (parent categories without parent_category)
  getBroaderCategories: async () => {
    const response = await apiClient.get('/categories/', {
      params: { parent_category__isnull: true }
    });
    return response.data;
  },

  // Get sub-categories for a specific broader category
  getSubCategories: async (parentCategoryId) => {
    const response = await apiClient.get('/categories/', {
      params: { parent_category: parentCategoryId }
    });
    return response.data;
  },

  // Get available tracking types
  getTrackingTypes: async () => {
    const response = await apiClient.get('/categories/tracking_types/');
    return response.data;
  },
};

export default itemsAPI;