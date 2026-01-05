// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../api/auth';
import { usersAPI } from '../api/users';
import { storage } from '../utils/storage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
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
      // Clear all cached queries before login to prevent data from previous user
      queryClient.clear();

      const data = await authAPI.login(username, password);

      // Check if user data is present in the response
      if (!data.user) {
        console.error('Login response missing user data:', data);
        return {
          success: false,
          error: 'Login failed. Server did not return user data. Please try again or contact support.',
        };
      }

      // Store tokens
      storage.setTokens(data.access, data.refresh);

      // Store user data
      storage.setUser(data.user);

      // Store permissions (backend includes permissions in user object)
      if (data.user && data.user.permissions) {
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
        error: error.response?.data?.detail || error.response?.data?.error || 'Login failed. Please check your credentials.',
      };
    }
  };

  // Logout function
  const logout = () => {
    // Clear all cached queries to prevent data leakage between users
    queryClient.clear();

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