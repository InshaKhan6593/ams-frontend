// src/pages/Inventory/InventoryPage.jsx
// Role-aware inventory page that shows appropriate view based on user role
import { usePermissions } from '../../hooks/usePermissions';
import MyStoreInventory from './MyStoreInventory';
import StoreOverview from './StoreOverview';

const InventoryPage = () => {
  const { isLocationHead, isStockIncharge, isSystemAdmin, isSuperuser } = usePermissions();

  // Stock Incharge (who is NOT also a Location Head or Admin) sees MyStoreInventory
  // Location Head, System Admin, and Superuser see StoreOverview
  const showMyStoreView = isStockIncharge() && !isLocationHead() && !isSystemAdmin() && !isSuperuser();

  if (showMyStoreView) {
    return <MyStoreInventory />;
  }

  return <StoreOverview />;
};

export default InventoryPage;
