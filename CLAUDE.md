# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an inventory/asset management system frontend built with React 19, Vite, and Tailwind CSS. It connects to a Django REST backend (default: `http://localhost:8000/api`).

## Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all Playwright tests
npm run test:headed  # Run tests with browser visible
npm run test:ui      # Open Playwright UI mode
npm run test -- tests/playwright/inspection_workflow_api.spec.js  # Run single test file
```

## Architecture

### Data Flow Pattern

1. **API Layer** (`src/api/`) - Axios-based API modules per resource (e.g., `items.js`, `stockEntries.js`)
   - All use shared `client.js` which handles JWT auth tokens and automatic refresh
   - API base URL configured via `VITE_API_BASE_URL` env var

2. **React Query Hooks** (`src/hooks/queries/`) - Caching layer with query key factories
   - Pattern: `useItems()`, `useItem(id)` for fetching
   - Query keys defined at top of each file (e.g., `itemsKeys.list(filters)`)
   - Default 5-minute stale time

3. **Page Components** (`src/pages/`) - Feature-organized folders
   - Each folder has an `index.js` for exports
   - Forms handle both create and edit via route params

### Authentication & Permissions

- `AuthContext` provides `user`, `permissions`, `isAuthenticated`, `login`, `logout`
- `useAuth()` hook accesses auth context
- `usePermissions()` hook provides permission checking:
  - `hasPermission(key)` - Single permission check
  - `hasAnyPermission([keys])` - OR logic
  - `isSuperuser()`, `isSystemAdmin()`, `isLocationHead()`, etc.
- Permission keys defined in `src/constants/permissions.js`

### Key Patterns

- **Route Protection**: `ProtectedRoute` and `PublicRoute` wrappers in `App.jsx`
- **Layout**: Nested routing with `Layout` component containing `Sidebar` and content outlet
- **Forms**: Use controlled components with React state, handle both create/edit modes
- **Icons**: lucide-react icons throughout

### Item Types

The system handles three tracking types for inventory:
- **Fixed Assets** - Individual instance tracking
- **Consumables** - Quantity-based tracking
- **Perishables** - Batch/expiry tracking

## Testing

Tests are in `tests/playwright/`. The test base URL points to the backend at `localhost:8000`, not the Vite dev server.
