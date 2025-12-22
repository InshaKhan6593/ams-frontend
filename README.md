# University Inventory Management System - Frontend

A comprehensive inventory management system for universities with hierarchical location management, role-based access control, and multi-stage approval workflows.

## Overview

This React-based frontend application manages three types of inventory tracking:
- **Individual (Fixed Assets)**: QR-coded items with depreciation and maintenance tracking
- **Bulk (Consumables)**: Quantity-based tracking with minimum stock alerts
- **Batch (Perishables)**: FIFO tracking with expiry date management

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router v7** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client with JWT interceptors
- **Lucide React** - Icon library

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Running Django backend (see backend repository)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your backend URL
# VITE_API_BASE_URL=http://localhost:8000/api

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

```bash
npm run dev      # Start development server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── api/                    # API client modules
│   ├── client.js          # Axios instance with interceptors
│   ├── auth.js            # Authentication endpoints
│   ├── items.js           # Item management
│   ├── inspections.js     # Multi-stage workflow
│   └── ...
├── components/
│   ├── layout/            # Layout components (Sidebar, Header)
│   └── common/            # Reusable components
├── pages/                 # Route components
│   ├── Inspections/       # 4-stage approval workflow
│   ├── StockEntries/      # Stock receipt management
│   ├── InterStoreRequests/# Store transfer requests
│   └── ...
├── context/
│   └── AuthContext.jsx    # Global auth state
├── hooks/
│   └── usePermissions.js  # Permission checking utilities
├── constants/
│   └── permissions.js     # Permission definitions
├── utils/
│   └── storage.js         # localStorage wrapper
├── App.jsx                # Route definitions
└── main.jsx               # App entry point
```

## Key Features

### Authentication & Authorization
- JWT-based authentication with automatic token refresh
- Permission-based access control with custom roles
- Role hierarchy: System Admin > Location Head > Stock Incharge > Auditor

### Multi-Stage Inspection Workflow
Complex 4-stage approval process for inspection certificates:
1. **INITIATED**: Draft creation with contract and item details
2. **STOCK_DETAILS**: Storage location assignment (skipped for root stores)
3. **CENTRAL_REGISTER**: Link inspection items to system item master
4. **AUDIT_REVIEW**: Final auditor approval

### Inventory Management
- Real-time inventory tracking across hierarchical locations
- QR code scanning for fixed assets
- Batch tracking with FIFO consumption for perishables
- Bulk quantity tracking for consumables

### Inter-Store Transfers
- Request-based transfer workflow between stores
- Availability marking and dispatch management
- Instance/batch selection for partial fulfillment
- Acknowledgment workflow for receipt verification

### Maintenance Tracking
- Preventive and corrective maintenance scheduling
- Maintenance history and cost tracking
- Status workflow: Scheduled → In Progress → Completed

## Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API base URL (required)
VITE_API_BASE_URL=http://localhost:8000/api
```

## Development Guidelines

### Code Style
- Follow existing component patterns (List, Form, Details)
- Use Tailwind CSS utility classes (no CSS modules)
- Leverage pre-built component classes (`.btn-primary`, `.input-field`, `.card`)
- Import icons from `lucide-react`

### State Management
- Global auth state via Context API (`useAuth()` hook)
- Local component state with `useState`
- No global state management library (Redux, Zustand, etc.)

### API Integration
- All API calls use centralized axios client (`src/api/client.js`)
- Automatic JWT token injection and refresh
- Consistent error handling: `error.response?.data?.detail || 'Operation failed'`

### Permission Checking
```javascript
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';

const { hasPermission, hasAnyPermission } = usePermissions();

// Single permission
{hasPermission(PERMISSIONS.ITEMS.EDIT) && <EditButton />}

// Multiple permissions (OR logic)
{hasAnyPermission([PERMISSIONS.STOCK.ISSUE, PERMISSIONS.STOCK.TRANSFER]) && <Component />}
```

## Testing

### Manual Testing Checklist
- [ ] Login/logout flow
- [ ] Token refresh on expiry
- [ ] Permission-based menu visibility
- [ ] Multi-stage inspection workflow
- [ ] Stock entry creation and acknowledgment
- [ ] Inter-store request lifecycle
- [ ] QR code scanning
- [ ] Maintenance scheduling

### Test with Different Roles
Test each feature with users assigned to different roles:
- SYSTEM_ADMIN (full access)
- LOCATION_HEAD (location hierarchy management)
- STOCK_INCHARGE (store operations)
- AUDITOR (inspection approval)

## Common Issues

### 401 Unauthorized Errors
- Check if backend is running
- Verify `VITE_API_BASE_URL` in `.env`
- Clear localStorage and re-login
- Check browser console for token refresh attempts

### API Response Handling
Some endpoints return arrays, others return paginated objects:
```javascript
const data = await api.fetchItems();
const items = Array.isArray(data) ? data : data.results || [];
```

### Permission Issues
- Refresh permissions after role changes: `refreshPermissions()`
- Check aggregated permissions in browser DevTools: `localStorage.getItem('permissions')`

## Backend Integration

This frontend requires the Django REST Framework backend (separate repository).

**Backend Repository:** `C:\Users\Insha Khan\ams_v3_user`

The `backend/` folder in this repository contains **reference copies only** for understanding API contracts.

## Documentation

- **CLAUDE.md** - Comprehensive guide for AI code assistants
- **DEPLOYMENT.md** - Deployment instructions and troubleshooting
- **FIXES_ARCHIVE.md** - Historical bug fixes and improvements

## Contributing

When adding new features:
1. Create API module in `src/api/` if needed
2. Create page component folder in `src/pages/FeatureName/`
3. Add route in `src/App.jsx`
4. Add navigation item in `Sidebar.jsx` with permission checks
5. Use existing component classes for consistency
6. Test with different user roles

## License

Proprietary - University Internal Use Only

## Support

For issues and questions:
- Check documentation in `CLAUDE.md` and `DEPLOYMENT.md`
- Review browser console and network tab for debugging
- Check Django backend logs for API errors
