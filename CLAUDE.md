# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based frontend for a university inventory management system with hierarchical location management, role-based access control, and multi-stage approval workflows. The system handles three types of inventory: Individual/Fixed Assets (QR-coded with depreciation tracking), Bulk/Consumables (quantity-based with minimum stock alerts), and Batch/Perishables (FIFO tracking with expiry dates).

**Backend repository:** `C:\Users\Insha Khan\ams_v3_user` (Django REST Framework)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (Vite with HMR on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Environment Setup

Create `.env` from `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

The backend must be running for the frontend to function.

## Core Architecture

### Authentication Flow

- **JWT-based auth** with automatic token refresh via axios interceptors
- Tokens stored in localStorage: `access_token`, `refresh_token`
- All API calls go through `src/api/client.js` which handles:
  - Automatic Bearer token injection
  - 401 error interception and token refresh
  - Automatic redirect to `/login` on auth failure
- Global auth state managed via `AuthContext` (Context API, no Redux/Zustand)

### Permission System

The app uses a granular permission-based access control system, not just role-based:

- **System roles:** SYSTEM_ADMIN, LOCATION_HEAD, STOCK_INCHARGE, AUDITOR
- **Custom roles:** Users can have multiple custom roles with aggregated permissions
- **Permission constants:** Defined in `src/constants/permissions.js`
- **Permission checking:** Use `usePermissions()` hook, NOT direct role checks

**IMPORTANT:** Always use the permission system for access control:
```javascript
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';

const { hasPermission, hasAnyPermission } = usePermissions();

// Single permission
{hasPermission(PERMISSIONS.ITEMS.EDIT) && <EditButton />}

// Multiple permissions (OR logic)
{hasAnyPermission([PERMISSIONS.STOCK.ISSUE, PERMISSIONS.STOCK.TRANSFER]) && <Component />}
```

### API Integration Patterns

All API calls use centralized modules in `src/api/`:
- `client.js` - Axios instance with interceptors (base for all API modules)
- `auth.js` - Login, logout, profile, token refresh
- `inspections.js` - Inspection certificate workflow
- `items.js` - Item master management
- `locations.js` - Location hierarchy
- `stockEntries.js` - Stock receipt management
- `interStoreRequests.js` - Inter-store transfer requests
- `inventory.js` - Inventory queries and distribution
- `maintenance.js` - Maintenance tracking
- `users.js` - User management
- `qr.js` - QR code scanning

**Response handling pattern:**
```javascript
try {
  const data = await api.fetchItems();
  // Some endpoints return arrays, others return paginated objects
  const items = Array.isArray(data) ? data : data.results || [];
} catch (error) {
  // Standard error format from Django REST
  const message = error.response?.data?.detail || 'Operation failed';
}
```

### Component Patterns

The codebase follows consistent patterns:

1. **List components** (`*List.jsx`): Display tables/grids with filters, search, pagination
2. **Form components** (`*Form.jsx`): Create/edit forms with validation
3. **Details components** (`*Details.jsx`): Read-only detail views

**Pre-built Tailwind classes** (defined in `src/index.css`):
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary button with border
- `.btn-ghost` - Transparent button
- `.input-field` - Text input with focus styles
- `.card` - White card with shadow and border
- `.stat-card` - Dashboard stat card with hover effect

**Icon library:** `lucide-react` (NOT react-icons or FontAwesome)

### Routing Structure

Routes defined in `src/App.jsx`:
- Public routes: `/login`
- Protected routes: All under `/dashboard/*` with Layout wrapper
- Route protection: `ProtectedRoute` component checks `isAuthenticated`
- 404 handling: Redirects to `/dashboard`

### State Management

- **Global:** AuthContext only (user, permissions, isAuthenticated)
- **Local:** Component-level `useState` for UI state
- **No global store:** No Redux, Zustand, or similar libraries

## Critical Workflows

### Multi-Stage Inspection Workflow

The inspection certificate workflow is the most complex feature with 4 stages:

1. **INITIATED** (Stage 1): Draft creation with contract details and item list
   - Form: `InspectionStage1Form.jsx`
   - API: `inspectionsAPI.create()`, `inspectionsAPI.submitToStockIncharge()`

2. **STOCK_DETAILS** (Stage 2): Storage location assignment (skipped for root stores)
   - Form: `InspectionStage2Form.jsx`
   - API: `inspectionsAPI.submitStockDetails()`

3. **CENTRAL_REGISTER** (Stage 3): Link inspection items to system item master
   - Form: `InspectionStage3Form.jsx` (complex linking logic)
   - API: `inspectionsAPI.linkToExistingItem()`, `inspectionsAPI.createAndLinkItem()`
   - Can create new items or link to existing items
   - Can create sub-categories on-the-fly

4. **AUDIT_REVIEW** (Stage 4): Final auditor approval
   - Form: `InspectionStage4Form.jsx`
   - API: `inspectionsAPI.submitAuditReview()` → COMPLETED status

**At any stage:** Can reject with `inspectionsAPI.reject(id, reason)` → REJECTED status

**Stage progression:**
- Root stores: INITIATED → CENTRAL_REGISTER → AUDIT_REVIEW → COMPLETED
- Non-root stores: INITIATED → STOCK_DETAILS → CENTRAL_REGISTER → AUDIT_REVIEW → COMPLETED

### Inter-Store Transfer Workflow

Complex request-based transfer between stores:

1. **Request creation** - Requester creates request for items from source store
2. **Availability marking** - Source store marks items/batches/instances as available
3. **Dispatch** - Source store dispatches marked items
4. **Acknowledgment** - Destination store acknowledges receipt

**Partial fulfillment:** Source can mark only some requested instances/batches

## Code Style Guidelines

### Tailwind CSS Usage
- Use utility classes ONLY (no CSS modules, no styled-components)
- Leverage pre-built component classes (`.btn-primary`, `.input-field`, `.card`)
- Color palette: `primary-*` for primary actions, `gray-*` for UI elements
- Responsive: Mobile-first with `sm:`, `md:`, `lg:` breakpoints

### Component Structure
```jsx
// Standard pattern for list components
const ComponentList = () => {
  const { hasPermission } = usePermissions();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await api.getAll();
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="card">
      {/* Component content */}
    </div>
  );
};
```

### Adding New Features

When adding features, follow this checklist:

1. Create API module in `src/api/` if new endpoints needed
2. Create page component folder in `src/pages/FeatureName/`
   - Include List, Form, Details components as needed
3. Add routes in `src/App.jsx` under protected routes
4. Add navigation item in `src/components/layout/Sidebar.jsx` with permission checks
5. Use existing component classes for visual consistency
6. Test with different user roles and permission sets

### Form Validation
- Use controlled components with `useState`
- Client-side validation before API submission
- Display backend validation errors from `error.response?.data`
- Disable submit buttons during loading with `disabled:opacity-50` class

### Loading States
- Use `LoadingSpinner` component from `src/components/common/LoadingSpinner`
- Show spinner during data fetching
- Disable buttons during API calls with `disabled` attribute

## Common Pitfalls

### API Response Inconsistencies
Some endpoints return arrays, others return paginated objects with `results`:
```javascript
const items = Array.isArray(data) ? data : data.results || [];
```

### Permission Refresh
After role changes, permissions must be refreshed:
```javascript
const { refreshPermissions } = useAuth();
await refreshPermissions(); // Fetches updated permissions and user data
```

### Token Refresh
The axios interceptor handles token refresh automatically. If you see:
- Rapid 401 errors → Check if backend is running
- Infinite refresh loops → Clear localStorage and re-login

### Direct Role Checks (Anti-pattern)
```javascript
// ❌ BAD: Direct role check
if (user?.role === 'SYSTEM_ADMIN') { ... }

// ✅ GOOD: Permission-based check
if (hasPermission(PERMISSIONS.ITEMS.CREATE)) { ... }
```

### Hardcoded API URLs
```javascript
// ❌ BAD: Direct axios call
await axios.get('http://localhost:8000/api/items/');

// ✅ GOOD: Use API modules
await itemsAPI.getAll();
```

## Backend Integration Notes

- Backend runs on `http://localhost:8000` (Django)
- API endpoints are under `/api/` prefix
- Authentication: `/api/auth/login/`, `/api/auth/refresh/`
- All endpoints require JWT Bearer token except login
- Django REST Framework pagination: `{ count, next, previous, results }`
- Error format: `{ detail: "Error message" }` or field-specific errors

## Testing Checklist

When testing features:
- [ ] Test with all 4 system roles (SYSTEM_ADMIN, LOCATION_HEAD, STOCK_INCHARGE, AUDITOR)
- [ ] Test with custom role combinations
- [ ] Test permission-based UI visibility
- [ ] Test token expiration and auto-refresh
- [ ] Test with empty data states
- [ ] Test error handling (network errors, validation errors)
- [ ] Test responsive design on mobile viewport

## Debugging Tips

- **API errors:** Check browser Network tab for request/response details
- **Permission issues:** Check `localStorage.getItem('permissions')` in browser console
- **Auth issues:** Check if tokens exist in localStorage (`access_token`, `refresh_token`)
- **Backend logs:** Check Django console for backend errors
- **React errors:** Check browser Console tab for JavaScript errors
