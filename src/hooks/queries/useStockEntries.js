// src/hooks/queries/useStockEntries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockEntriesAPI } from '../../api/stockEntries';

/**
 * Query key factory for stock entries
 */
export const stockEntriesKeys = {
  all: ['stockEntries'],
  lists: () => [...stockEntriesKeys.all, 'list'],
  list: (filters) => [...stockEntriesKeys.lists(), filters],
  details: () => [...stockEntriesKeys.all, 'detail'],
  detail: (id) => [...stockEntriesKeys.details(), id],
};

/**
 * Hook to fetch stock entries list with caching
 * @param {Object} params - Query parameters (entry_type, status, search, page)
 * @param {Object} options - React Query options
 */
export function useStockEntries(params = {}, options = {}) {
  return useQuery({
    queryKey: stockEntriesKeys.list(params),
    queryFn: async () => {
      const data = await stockEntriesAPI.getAll(params);
      // Handle both array and paginated response formats
      return Array.isArray(data) ? data : (data.results || []);
    },
    ...options,
  });
}

/**
 * Hook to fetch a single stock entry with caching
 * @param {string|number} id - Stock entry ID
 * @param {Object} options - React Query options
 */
export function useStockEntry(id, options = {}) {
  return useQuery({
    queryKey: stockEntriesKeys.detail(id),
    queryFn: () => stockEntriesAPI.get(id),
    enabled: !!id, // Only run query if ID exists
    ...options,
  });
}

/**
 * Hook to create a stock entry
 */
export function useCreateStockEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => stockEntriesAPI.create(data),
    onSuccess: () => {
      // Invalidate and refetch stock entries list
      queryClient.invalidateQueries({ queryKey: stockEntriesKeys.lists() });
    },
  });
}

/**
 * Hook to update a stock entry
 */
export function useUpdateStockEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => stockEntriesAPI.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific entry and list
      queryClient.invalidateQueries({ queryKey: stockEntriesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: stockEntriesKeys.lists() });
    },
  });
}

/**
 * Hook to delete a stock entry
 */
export function useDeleteStockEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => stockEntriesAPI.delete(id),
    onSuccess: () => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: stockEntriesKeys.lists() });
    },
  });
}

/**
 * Hook to acknowledge a stock entry receipt
 * Invalidates stock entries, pending tasks, and dashboard stats
 */
export function useAcknowledgeStockEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => stockEntriesAPI.acknowledgeReceipt(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific entry and list
      queryClient.invalidateQueries({ queryKey: stockEntriesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: stockEntriesKeys.lists() });

      // CRITICAL: Invalidate pending tasks so notifications update immediately
      queryClient.invalidateQueries({ queryKey: ['pendingTasks'] });

      // Invalidate dashboard stats (may include pending counts)
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });

      // Invalidate inter-store requests (if this was part of a request, it's now complete)
      queryClient.invalidateQueries({ queryKey: ['interStoreRequests'] });
    },
  });
}
