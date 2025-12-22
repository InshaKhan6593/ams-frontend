// src/api/qr.js
import apiClient from './client';

export const qrAPI = {
  // Get QR code data for an asset instance
  getQRData: async (instanceCode) => {
    const response = await apiClient.get(`/asset-qr/${instanceCode}/`);
    return response.data;
  },

  // Download QR code image
  downloadQRCode: async (instanceCode) => {
    const response = await apiClient.get(`/asset-qr/${instanceCode}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Regenerate QR code for an asset
  regenerateQRCode: async (instanceCode) => {
    const response = await apiClient.post(`/asset-qr/${instanceCode}/regenerate/`);
    return response.data;
  },

  // Get asset movement history
  getMovementHistory: async (instanceCode) => {
    const response = await apiClient.get(`/asset-movement-history/${instanceCode}/`);
    return response.data;
  },
};

export default qrAPI;
