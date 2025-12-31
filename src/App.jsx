// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import UsersList from './pages/Users/UsersList';
import UserForm from './pages/Users/UserForm';
import CustomRolesList from './pages/Users/CustomRolesList';
import CustomRoleForm from './pages/Users/CustomRoleForm';
import LocationsList from './pages/Locations/LocationsList';
import LocationForm from './pages/Locations/LocationForm';
import ItemsList from './pages/Items/ItemsList';
import ItemForm from './pages/Items/ItemForm';
import CategoriesList from './pages/Categories/CategoriesList';
import CategoryForm from './pages/Categories/CategoryForm';
import { InspectionsList, InspectionForm, InspectionDetails } from './pages/Inspections';
import { InventoryPage, FixedAssetDistribution, ConsumableDistribution, PerishableDistribution } from './pages/Inventory';
import { StockEntriesList, StockEntryForm, StockEntryDetails } from './pages/StockEntries';
import { AcknowledgmentsList, AcknowledgmentForm } from './pages/Acknowledgments';
import { ReturnAcknowledgmentsList, ReturnAcknowledgmentForm } from './pages/Returns';
import { RequestsList, RequestForm, RequestDetails } from './pages/InterStoreRequests';
import { MaintenanceList, MaintenanceForm, MaintenancePaper } from './pages/Maintenance';
import QRScanner from './pages/QRScanner/QRScanner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        {/* Stock Entries */}
        <Route path="stock-entries" element={<StockEntriesList />} />
        <Route path="stock-entries/new" element={<StockEntryForm />} />
        <Route path="stock-entries/:id/edit" element={<StockEntryForm />} />
        <Route path="stock-entries/:id" element={<StockEntryDetails />} />
        
        {/* Acknowledgments */}
        <Route path="acknowledgments" element={<AcknowledgmentsList />} />
        <Route path="acknowledgments/:id" element={<AcknowledgmentForm />} />
        
        {/* Returns */}
        <Route path="returns" element={<ReturnAcknowledgmentsList />} />
        <Route path="returns/:id" element={<ReturnAcknowledgmentForm />} />
        
        {/* Store Requests */}
        <Route path="store-requests" element={<RequestsList />} />
        <Route path="store-requests/new" element={<RequestForm />} />
        <Route path="store-requests/:id" element={<RequestDetails />} />
        
        {/* Inspections */}
        <Route path="inspections" element={<InspectionsList />} />
        <Route path="inspections/new" element={<InspectionForm />} />
        <Route path="inspections/:id/edit" element={<InspectionForm />} />
        <Route path="inspections/:id/view" element={<InspectionDetails />} />

        {/* Maintenance */}
        <Route path="maintenance" element={<MaintenanceList />} />
        <Route path="maintenance/new" element={<MaintenanceForm />} />
        <Route path="maintenance/:id" element={<MaintenanceForm />} />
        <Route path="maintenance/:id/edit" element={<MaintenanceForm />} />
        <Route path="maintenance/:id/paper" element={<MaintenancePaper />} />

        {/* Locations */}
        <Route path="locations" element={<LocationsList />} />
        <Route path="locations/new" element={<LocationForm />} />
        <Route path="locations/:id" element={<LocationForm />} />
        
        {/* Categories */}
        <Route path="categories" element={<CategoriesList />} />
        <Route path="categories/new" element={<CategoryForm />} />
        <Route path="categories/:id" element={<CategoryForm />} />
        
        {/* Items */}
        <Route path="items" element={<ItemsList />} />
        <Route path="items/new" element={<ItemForm />} />
        <Route path="items/:id" element={<ItemForm />} />
        
        {/* Inventory - Using index.js export */}
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/fixed-assets/:itemId/distribution" element={<FixedAssetDistribution />} />
        <Route path="inventory/consumables/:itemId/distribution" element={<ConsumableDistribution />} />
        <Route path="inventory/perishables/:itemId/distribution" element={<PerishableDistribution />} />
        
        {/* QR Scanner */}
        <Route path="qr-scanner" element={<QRScanner />} />
        
        {/* Users */}
        <Route path="users" element={<UsersList />} />
        <Route path="users/new" element={<UserForm />} />
        <Route path="users/:id" element={<UserForm />} />

        {/* Custom Roles */}
        <Route path="users/custom-roles" element={<CustomRolesList />} />
        <Route path="users/custom-roles/new" element={<CustomRoleForm />} />
        <Route path="users/custom-roles/:id" element={<CustomRoleForm />} />
      </Route>

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 - Redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;