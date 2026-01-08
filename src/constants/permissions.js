// src/constants/permissions.js
// Permission constants matching backend CustomRole model

export const PERMISSIONS = {
  // Inspection Certificates
  INSPECTIONS: {
    VIEW: 'can_view_inspection_certificates',
    INITIATE: 'can_initiate_inspection_certificates',
    EDIT: 'can_edit_inspection_certificates',
    SUBMIT_STAGE: 'can_submit_inspection_stage',
    FILL_STOCK_DETAILS: 'can_fill_stock_details',
    FILL_CENTRAL_REGISTER: 'can_fill_central_register',
    REVIEW_AS_AUDITOR: 'can_review_as_auditor',
    DOWNLOAD_PDF: 'can_download_inspection_pdf',
  },

  // Stock/Inventory
  STOCK: {
    VIEW_INVENTORY: 'can_view_inventory',
    CREATE_ENTRIES: 'can_create_stock_entries',
    ISSUE: 'can_issue_stock',
    RECEIVE: 'can_receive_stock',
    TRANSFER: 'can_transfer_stock',
    ACKNOWLEDGE: 'can_acknowledge_stock',
    RETURN: 'can_return_stock',
  },

  // Items
  ITEMS: {
    VIEW: 'can_view_items',
    CREATE: 'can_create_items',
    EDIT: 'can_edit_items',
    DELETE: 'can_delete_items',
    MANAGE_CATEGORIES: 'can_manage_categories',
  },

  // Categories
  CATEGORIES: {
    VIEW: 'can_view_categories',
    CREATE: 'can_create_categories',
    EDIT: 'can_edit_categories',
    DELETE: 'can_delete_categories',
    MANAGE: 'can_manage_categories',
  },

  // Locations
  LOCATIONS: {
    VIEW: 'can_view_locations',
    CREATE: 'can_create_locations',
    EDIT: 'can_edit_locations',
    DELETE: 'can_delete_locations',
  },

  // Users
  USERS: {
    VIEW: 'can_view_users',
    CREATE: 'can_create_users',
    EDIT: 'can_edit_users',
    ASSIGN_CUSTOM_ROLES: 'can_assign_custom_roles',
  },

  // Maintenance
  MAINTENANCE: {
    VIEW: 'can_view_maintenance',
    CREATE: 'can_create_maintenance',
    COMPLETE: 'can_complete_maintenance',
    APPROVE: 'can_approve_maintenance',
  },

  // Inter-store Requests
  INTER_STORE: {
    CREATE: 'can_create_inter_store_requests',
    FULFILL: 'can_fulfill_inter_store_requests',
    ACKNOWLEDGE: 'can_acknowledge_inter_store_requests',
  },

  // Reports
  REPORTS: {
    VIEW: 'can_view_reports',
    EXPORT: 'can_export_data',
  },
};

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  inspections: {
    label: 'Inspection Certificates',
    icon: 'FileText',
    description: 'Manage inspection certificates and approval workflows',
    permissions: [
      'can_view_inspection_certificates',
      'can_initiate_inspection_certificates',
      'can_edit_inspection_certificates',
      'can_submit_inspection_stage',
      'can_fill_stock_details',
      'can_fill_central_register',
      'can_review_as_auditor',
      'can_download_inspection_pdf',
    ],
  },
  stock: {
    label: 'Stock & Inventory',
    icon: 'Package',
    description: 'Manage stock entries, transfers, and inventory operations',
    permissions: [
      'can_view_inventory',
      'can_create_stock_entries',
      'can_issue_stock',
      'can_receive_stock',
      'can_transfer_stock',
      'can_acknowledge_stock',
      'can_return_stock',
    ],
  },
  items: {
    label: 'Items Management',
    icon: 'Box',
    description: 'Create and manage item catalog',
    permissions: [
      'can_view_items',
      'can_create_items',
      'can_edit_items',
      'can_delete_items',
    ],
  },
  locations: {
    label: 'Location Management',
    icon: 'MapPin',
    description: 'Manage organizational locations and hierarchy',
    permissions: [
      'can_view_locations',
      'can_create_locations',
      'can_edit_locations',
      'can_delete_locations',
    ],
  },
  users: {
    label: 'User Management',
    icon: 'Users',
    description: 'Manage users and role assignments',
    permissions: [
      'can_view_users',
      'can_create_users',
      'can_edit_users',
      'can_assign_custom_roles',
    ],
  },
  maintenance: {
    label: 'Maintenance',
    icon: 'Wrench',
    description: 'Manage maintenance schedules and approvals',
    permissions: [
      'can_view_maintenance',
      'can_create_maintenance',
      'can_complete_maintenance',
      'can_approve_maintenance',
    ],
  },
  interStore: {
    label: 'Inter-Store Requests',
    icon: 'ArrowRightLeft',
    description: 'Handle transfers between stores',
    permissions: [
      'can_create_inter_store_requests',
      'can_fulfill_inter_store_requests',
      'can_acknowledge_inter_store_requests',
    ],
  },
  reports: {
    label: 'Reports & Export',
    icon: 'BarChart3',
    description: 'View reports and export data',
    permissions: [
      'can_view_reports',
      'can_export_data',
    ],
  },
};

// Human-readable permission labels
export const PERMISSION_LABELS = {
  // Inspections
  can_view_inspection_certificates: 'View Inspection Certificates',
  can_initiate_inspection_certificates: 'Initiate/Create Inspections',
  can_edit_inspection_certificates: 'Edit Inspection Certificates',
  can_submit_inspection_stage: 'Submit to Next Stage',
  can_fill_stock_details: 'Fill Stock Details (Stage 2)',
  can_fill_central_register: 'Fill Central Register (Stage 3)',
  can_review_as_auditor: 'Review as Auditor (Stage 4)',
  can_download_inspection_pdf: 'Download Inspection PDFs',

  // Stock/Inventory
  can_view_inventory: 'View Inventory',
  can_create_stock_entries: 'Create Stock Entries',
  can_issue_stock: 'Issue Stock',
  can_receive_stock: 'Receive Stock',
  can_transfer_stock: 'Transfer Stock',
  can_acknowledge_stock: 'Acknowledge Stock Transfers',
  can_return_stock: 'Return Stock',

  // Items
  can_view_items: 'View Items',
  can_create_items: 'Create Items',
  can_edit_items: 'Edit Items',
  can_delete_items: 'Delete Items',

  // Locations
  can_view_locations: 'View Locations',
  can_create_locations: 'Create Locations',
  can_edit_locations: 'Edit Locations',
  can_delete_locations: 'Delete Locations',

  // Users
  can_view_users: 'View Users',
  can_create_users: 'Create Users',
  can_edit_users: 'Edit Users',
  can_assign_custom_roles: 'Assign Custom Roles',

  // Maintenance
  can_view_maintenance: 'View Maintenance Records',
  can_create_maintenance: 'Create Maintenance Records',
  can_complete_maintenance: 'Complete Maintenance Tasks',
  can_approve_maintenance: 'Approve Maintenance',

  // Inter-store
  can_create_inter_store_requests: 'Create Inter-Store Requests',
  can_fulfill_inter_store_requests: 'Fulfill Inter-Store Requests',
  can_acknowledge_inter_store_requests: 'Acknowledge Inter-Store Requests',

  // Reports
  can_view_reports: 'View Reports',
  can_export_data: 'Export Data',
};

export default PERMISSIONS;
