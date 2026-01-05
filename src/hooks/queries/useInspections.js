// src/hooks/queries/useInspections.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inspectionsAPI } from '../../api/inspections';

/**
 * Query key factory for inspections
 */
export const inspectionsKeys = {
  all: ['inspections'],
  lists: () => [...inspectionsKeys.all, 'list'],
  list: (filters) => [...inspectionsKeys.lists(), filters],
  details: () => [...inspectionsKeys.all, 'detail'],
  detail: (id) => [...inspectionsKeys.details(), id],
};

/**
 * Hook to fetch inspections list with caching
 * @param {Object} params - Query parameters (stage, department, search, page)
 * @param {Object} options - React Query options
 */
export function useInspections(params = {}, options = {}) {
  return useQuery({
    queryKey: inspectionsKeys.list(params),
    queryFn: async () => {
      const data = await inspectionsAPI.getAll(params);
      // Handle both array and paginated response formats
      return Array.isArray(data) ? data : (data.results || []);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
    refetchOnWindowFocus: false, // Disable refetch on focus to prevent flickering
    refetchInterval: false, // Disable auto-refetch to prevent unexpected updates
    ...options,
  });
}

/**
 * Hook to fetch a single inspection with caching
 * @param {string|number} id - Inspection ID
 * @param {Object} options - React Query options
 */
export function useInspection(id, options = {}) {
  return useQuery({
    queryKey: inspectionsKeys.detail(id),
    queryFn: () => inspectionsAPI.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
    refetchOnWindowFocus: false, // Disable refetch on focus to prevent flickering
    ...options,
  });
}

/**
 * Hook to update inspection
 */
export function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => inspectionsAPI.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific inspection and lists
      queryClient.invalidateQueries({ queryKey: inspectionsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: inspectionsKeys.lists() });
      // Also invalidate pending tasks as inspection status may have changed
      queryClient.invalidateQueries({ queryKey: ['pendingTasks'] });
    },
  });
}
