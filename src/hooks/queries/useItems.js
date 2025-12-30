// src/hooks/queries/useItems.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { itemsAPI } from '../../api/items';

/**
 * Query key factory for items
 */
export const itemsKeys = {
  all: ['items'],
  lists: () => [...itemsKeys.all, 'list'],
  list: (filters) => [...itemsKeys.lists(), filters],
  details: () => [...itemsKeys.all, 'detail'],
  detail: (id) => [...itemsKeys.details(), id],
};

/**
 * Hook to fetch items list with caching
 * @param {Object} params - Query parameters (category, search, page, etc.)
 * @param {Object} options - React Query options
 */
export function useItems(params = {}, options = {}) {
  return useQuery({
    queryKey: itemsKeys.list(params),
    queryFn: async () => {
      const data = await itemsAPI.getAll(params);
      // Handle both array and paginated response formats
      return Array.isArray(data) ? data : (data.results || []);
    },
    staleTime: 5 * 60 * 1000, // Items list cached for 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single item with caching
 * @param {string|number} id - Item ID
 * @param {Object} options - React Query options
 */
export function useItem(id, options = {}) {
  return useQuery({
    queryKey: itemsKeys.detail(id),
    queryFn: () => itemsAPI.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to prefetch items for better UX
 */
export function usePrefetchItems() {
  const queryClient = useQueryClient();

  return (params = {}) => {
    queryClient.prefetchQuery({
      queryKey: itemsKeys.list(params),
      queryFn: () => itemsAPI.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };
}
