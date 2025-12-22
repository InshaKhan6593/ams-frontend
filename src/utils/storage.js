// src/utils/storage.js

export const storage = {
  // Auth tokens
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },

  getAccessToken: () => {
    return localStorage.getItem('access_token');
  },

  getRefreshToken: () => {
    return localStorage.getItem('refresh_token');
  },

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // User data
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  clearUser: () => {
    localStorage.removeItem('user');
  },

  // Permissions
  setPermissions: (permissions) => {
    localStorage.setItem('permissions', JSON.stringify(permissions));
  },

  getPermissions: () => {
    const permissions = localStorage.getItem('permissions');
    return permissions ? JSON.parse(permissions) : null;
  },

  clearPermissions: () => {
    localStorage.removeItem('permissions');
  },

  // Clear all
  clearAll: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

export default storage;