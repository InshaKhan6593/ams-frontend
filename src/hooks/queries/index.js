// src/hooks/queries/index.js
/**
 * Centralized export for all React Query hooks
 * Makes importing easier and more consistent
 */

// Stock Entries
export {
  useStockEntries,
  useStockEntry,
  useCreateStockEntry,
  useUpdateStockEntry,
  useDeleteStockEntry,
  useAcknowledgeStockEntry,
  stockEntriesKeys,
} from './useStockEntries';

// Locations
export {
  useLocations,
  useLocation,
  useLocationTree,
  useStandaloneLocations,
  locationsKeys,
} from './useLocations';

// Items
export {
  useItems,
  useItem,
  usePrefetchItems,
  itemsKeys,
} from './useItems';

// Inspections
export {
  useInspections,
  useInspection,
  useUpdateInspection,
  inspectionsKeys,
} from './useInspections';

// Dashboard & User Data
export {
  useDashboardStats,
  usePendingTasks,
  useUserProfile,
  useUserPermissions,
  dashboardKeys,
} from './useDashboard';
