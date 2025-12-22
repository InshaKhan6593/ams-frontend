// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import { usersAPI } from '../api/users';
import { storage } from '../utils/storage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = storage.getAccessToken();
      const savedUser = storage.getUser();
      const savedPermissions = storage.getPermissions();

      if (token && savedUser) {
        setUser(savedUser);
        setPermissions(savedPermissions);
        setIsAuthenticated(true);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const data = await authAPI.login(username, password);

      // Store tokens
      storage.setTokens(data.access, data.refresh);

      // Store user data
      storage.setUser(data.user);

      // Store permissions (backend includes permissions in user object)
      if (data.user.permissions) {
        storage.setPermissions(data.user.permissions);
        setPermissions(data.user.permissions);
      }

      // Update state
      setUser(data.user);
      setIsAuthenticated(true);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed. Please check your credentials.',
      };
    }
  };

  // Logout function
  const logout = () => {
    storage.clearAll();
    setUser(null);
    setPermissions(null);
    setIsAuthenticated(false);
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const userData = await authAPI.getProfile();
      storage.setUser(userData);
      setUser(userData);

      // Also refresh permissions if included in profile
      if (userData.permissions) {
        storage.setPermissions(userData.permissions);
        setPermissions(userData.permissions);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Refresh permissions only
  const refreshPermissions = async () => {
    try {
      const perms = await usersAPI.getMyPermissions();
      storage.setPermissions(perms);
      setPermissions(perms);

      // Also refresh user to get updated custom_roles array
      await refreshUser();
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
    }
  };

  const value = {
    user,
    permissions,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUser,
    refreshPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;