// src/hooks/queries/useDashboard.js
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../../api/users';

/**
 * Query key factory for dashboard and user data
 */
export const dashboardKeys = {
  stats: ['dashboardStats'],
  pendingTasks: ['pendingTasks'],
  profile: ['userProfile'],
  permissions: ['userPermissions'],
};

/**
 * Hook to fetch dashboard statistics with caching
 * @param {Object} options - React Query options
 */
export function useDashboardStats(options = {}) {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => usersAPI.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch pending tasks with caching
 * Used by NotificationBell component
 * @param {Object} options - React Query options
 */
export function usePendingTasks(options = {}) {
  return useQuery({
    queryKey: dashboardKeys.pendingTasks,
    queryFn: () => usersAPI.getMyPendingTasks(),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (tasks change frequently)
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
    ...options,
  });
}

/**
 * Hook to fetch user profile with caching
 * @param {Object} options - React Query options
 */
export function useUserProfile(options = {}) {
  return useQuery({
    queryKey: dashboardKeys.profile,
    queryFn: () => usersAPI.getMyProfile(),
    staleTime: 10 * 60 * 1000, // Profile rarely changes, cache for 10 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    ...options,
  });
}

/**
 * Hook to fetch user permissions with caching
 * @param {Object} options - React Query options
 */
export function useUserPermissions(options = {}) {
  return useQuery({
    queryKey: dashboardKeys.permissions,
    queryFn: () => usersAPI.getMyPermissions(),
    staleTime: 10 * 60 * 1000, // Permissions rarely change
    cacheTime: 30 * 60 * 1000,
    ...options,
  });
}
