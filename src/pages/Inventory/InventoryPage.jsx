// src/pages/Inventory/InventoryPage.jsx
import { useState, useEffect } from 'react';
import { Package, Layers, Calendar } from 'lucide-react';
import FixedAssetsInventory from './FixedAssetsInventory';
import ConsumablesInventory from './ConsumablesInventory';
import PerishablesInventory from './PerishablesInventory';

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState('fixed-assets');

  const tabs = [
    {
      id: 'fixed-assets',
      name: 'Fixed Assets',
      icon: Package,
      description: 'Individual tracking - Computers, Chairs, Equipment',
      component: FixedAssetsInventory,
    },
    {
      id: 'consumables',
      name: 'Consumables',
      icon: Layers,
      description: 'Bulk tracking - Paper, Pens, Stationery',
      component: ConsumablesInventory,
    },
    {
      id: 'perishables',
      name: 'Perishables',
      icon: Calendar,
      description: 'Batch tracking - Food, Chemicals, Medicines',
      component: PerishablesInventory,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div>
        <h1 className="text-sm font-bold text-gray-900">Inventory Overview</h1>
        <p className="text-xs text-gray-600 mt-0.5">
          View and manage inventory by tracking type
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{tab.name}</p>
                  <p className="text-[10px] text-gray-500 truncate hidden sm:block">
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default InventoryPage;