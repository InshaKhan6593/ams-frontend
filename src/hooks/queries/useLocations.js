// src/hooks/queries/useLocations.js
import { useQuery } from '@tanstack/react-query';
import { locationsAPI } from '../../api/locations';

/**
 * Query key factory for locations
 */
export const locationsKeys = {
  all: ['locations'],
  lists: () => [...locationsKeys.all, 'list'],
  list: (filters) => [...locationsKeys.lists(), filters],
  tree: () => [...locationsKeys.all, 'tree'],
  standalone: () => [...locationsKeys.all, 'standalone'],
  mainStore: () => [...locationsKeys.all, 'mainStore'],
  details: () => [...locationsKeys.all, 'detail'],
  detail: (id) => [...locationsKeys.details(), id],
};

/**
 * Hook to fetch locations list with caching
 * @param {Object} params - Query parameters
 * @param {Object} options - React Query options
 */
export function useLocations(params = {}, options = {}) {
  return useQuery({
    queryKey: locationsKeys.list(params),
    queryFn: async () => {
      const data = await locationsAPI.getAll(params);
      // Handle both array and paginated response formats
      return Array.isArray(data) ? data : (data.results || []);
    },
    staleTime: 10 * 60 * 1000, // Locations don't change often, cache for 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch location tree with caching
 * @param {Object} options - React Query options
 */
export function useLocationTree(options = {}) {
  return useQuery({
    queryKey: locationsKeys.tree(),
    queryFn: () => locationsAPI.getTree(),
    staleTime: 10 * 60 * 1000, // Cache tree for 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch standalone locations with caching
 * @param {Object} options - React Query options
 */
export function useStandaloneLocations(options = {}) {
  return useQuery({
    queryKey: locationsKeys.standalone(),
    queryFn: () => locationsAPI.getStandalone(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single location with caching
 * @param {string|number} id - Location ID
 * @param {Object} options - React Query options
 */
export function useLocation(id, options = {}) {
  return useQuery({
    queryKey: locationsKeys.detail(id),
    queryFn: () => locationsAPI.get(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}
