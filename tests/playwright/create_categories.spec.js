// Playwright script to create 100 categories in AMS v3
// Run with: npx playwright test create_categories.spec.js

import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:8000';
const USERNAME = 'admin';
const PASSWORD = 'admin123';

// Category data generator
function generateCategoryData() {
  const broaderCategories = [
    // INDIVIDUAL tracking (Fixed Assets)
    { name: 'Computer Equipment', tracking_type: 'INDIVIDUAL' },
    { name: 'Laboratory Equipment', tracking_type: 'INDIVIDUAL' },
    { name: 'Furniture & Fixtures', tracking_type: 'INDIVIDUAL' },
    { name: 'Vehicles', tracking_type: 'INDIVIDUAL' },
    { name: 'Audio Visual Equipment', tracking_type: 'INDIVIDUAL' },
    { name: 'Medical Equipment', tracking_type: 'INDIVIDUAL' },
    { name: 'Sports Equipment', tracking_type: 'INDIVIDUAL' },
    { name: 'Musical Instruments', tracking_type: 'INDIVIDUAL' },
    { name: 'Industrial Machinery', tracking_type: 'INDIVIDUAL' },
    { name: 'Security Equipment', tracking_type: 'INDIVIDUAL' },

    // BULK tracking (Consumables)
    { name: 'Office Supplies', tracking_type: 'BULK' },
    { name: 'Cleaning Supplies', tracking_type: 'BULK' },
    { name: 'Electrical Supplies', tracking_type: 'BULK' },
    { name: 'Plumbing Supplies', tracking_type: 'BULK' },
    { name: 'Gardening Supplies', tracking_type: 'BULK' },
    { name: 'Printing Materials', tracking_type: 'BULK' },
    { name: 'Packaging Materials', tracking_type: 'BULK' },
    { name: 'Construction Materials', tracking_type: 'BULK' },

    // BATCH tracking (Perishables)
    { name: 'Laboratory Chemicals', tracking_type: 'BATCH' },
    { name: 'Medical Supplies', tracking_type: 'BATCH' },
    { name: 'Food Items', tracking_type: 'BATCH' },
    { name: 'Pharmaceuticals', tracking_type: 'BATCH' },
    { name: 'Research Reagents', tracking_type: 'BATCH' },
    { name: 'Safety Chemicals', tracking_type: 'BATCH' },
  ];

  const subcategoryTemplates = {
    'Computer Equipment': [
      { name: 'Desktop Computers', depreciation_rate: 20.00, depreciation_method: 'WDV' },
      { name: 'Laptops', depreciation_rate: 25.00, depreciation_method: 'WDV' },
      { name: 'Printers', depreciation_rate: 15.00, depreciation_method: 'SLM' },
      { name: 'Scanners', depreciation_rate: 15.00, depreciation_method: 'SLM' },
      { name: 'Servers', depreciation_rate: 20.00, depreciation_method: 'WDV' },
      { name: 'Networking Equipment', depreciation_rate: 20.00, depreciation_method: 'WDV' },
    ],
    'Laboratory Equipment': [
      { name: 'Microscopes', depreciation_rate: 10.00, depreciation_method: 'SLM' },
      { name: 'Centrifuges', depreciation_rate: 12.00, depreciation_method: 'WDV' },
      { name: 'Spectrophotometers', depreciation_rate: 15.00, depreciation_method: 'WDV' },
      { name: 'Incubators', depreciation_rate: 10.00, depreciation_method: 'SLM' },
      { name: 'Autoclaves', depreciation_rate: 10.00, depreciation_method: 'SLM' },
    ],
    'Furniture & Fixtures': [
      { name: 'Office Desks', depreciation_rate: 10.00, depreciation_method: 'SLM' },
      { name: 'Office Chairs', depreciation_rate: 15.00, depreciation_method: 'WDV' },
      { name: 'Filing Cabinets', depreciation_rate: 10.00, depreciation_method: 'SLM' },
      { name: 'Conference Tables', depreciation_rate: 10.00, depreciation_method: 'SLM' },
      { name: 'Shelving Units', depreciation_rate: 10.00, depreciation_method: 'SLM' },
    ],
    'Vehicles': [
      { name: 'Cars', depreciation_rate: 15.00, depreciation_method: 'WDV' },
      { name: 'Vans', depreciation_rate: 15.00, depreciation_method: 'WDV' },
      { name: 'Buses', depreciation_rate: 12.00, depreciation_method: 'WDV' },
      { name: 'Motorcycles', depreciation_rate: 20.00, depreciation_method: 'WDV' },
    ],
    'Audio Visual Equipment': [
      { name: 'Projectors', depreciation_rate: 20.00, depreciation_method: 'WDV' },
      { name: 'Smart Boards', depreciation_rate: 15.00, depreciation_method: 'WDV' },
      { name: 'Cameras', depreciation_rate: 20.00, depreciation_method: 'WDV' },
      { name: 'Sound Systems', depreciation_rate: 15.00, depreciation_method: 'WDV' },
    ],
    'Office Supplies': [
      { name: 'Pens & Pencils' },
      { name: 'Notebooks' },
      { name: 'Folders & Binders' },
      { name: 'Staplers & Clips' },
      { name: 'Adhesives & Tape' },
    ],
    'Cleaning Supplies': [
      { name: 'Detergents' },
      { name: 'Disinfectants' },
      { name: 'Mops & Brooms' },
      { name: 'Trash Bags' },
    ],
    'Laboratory Chemicals': [
      { name: 'Acids' },
      { name: 'Bases' },
      { name: 'Solvents' },
      { name: 'Indicators' },
      { name: 'Reagents' },
    ],
    'Medical Supplies': [
      { name: 'Bandages & Dressings' },
      { name: 'Syringes' },
      { name: 'Gloves' },
      { name: 'Masks' },
    ],
    'Food Items': [
      { name: 'Beverages' },
      { name: 'Snacks' },
      { name: 'Canned Goods' },
    ],
  };

  const categories = [];

  // Add all broader categories
  broaderCategories.forEach(cat => {
    categories.push({
      isBroader: true,
      ...cat,
      description: `${cat.name} - ${cat.tracking_type} tracking`
    });
  });

  // Add subcategories
  Object.keys(subcategoryTemplates).forEach(parentName => {
    subcategoryTemplates[parentName].forEach(subcat => {
      categories.push({
        isBroader: false,
        parentName: parentName,
        ...subcat,
        description: `${subcat.name} under ${parentName}`
      });
    });
  });

  // If we need more categories to reach 100, add more subcategories
  let counter = 1;
  const parentNames = Object.keys(subcategoryTemplates);
  while (categories.length < 100) {
    // Alternate between different parent categories for variety
    const parentName = parentNames[counter % parentNames.length];
    const trackingType = broaderCategories.find(b => b.name === parentName)?.tracking_type;

    // Determine if this should have depreciation (only for INDIVIDUAL tracking)
    const shouldHaveDepreciation = trackingType === 'INDIVIDUAL';

    categories.push({
      isBroader: false,
      parentName: parentName,
      name: `${parentName} Item ${counter}`,
      description: `Additional sub-category ${counter} under ${parentName}`,
      ...(shouldHaveDepreciation && {
        depreciation_rate: 15.00,
        depreciation_method: counter % 2 === 0 ? 'WDV' : 'SLM'
      })
    });
    counter++;
  }

  return categories.slice(0, 100);
}

test.describe('Create 100 Categories in AMS v3', () => {
  let authToken = '';
  let createdBroaderCategories = {};

  test('Should login and create 100 categories', async ({ request }) => {
    console.log('\n🔐 Step 1: Logging in...');

    // Step 1: Login to get JWT token
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login/`, {
      data: {
        username: USERNAME,
        password: PASSWORD
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.access;

    console.log('✅ Login successful! Token obtained.');
    console.log(`👤 User: ${loginData.user?.username || USERNAME}`);

    // Step 2: Generate category data
    const categories = generateCategoryData();
    console.log(`\n📦 Step 2: Preparing to create ${categories.length} categories...`);
    console.log(`   - Broader categories: ${categories.filter(c => c.isBroader).length}`);
    console.log(`   - Sub-categories: ${categories.filter(c => !c.isBroader).length}`);

    // Step 3: Create categories
    console.log('\n🚀 Step 3: Creating categories...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];

      try {
        if (category.isBroader) {
          // Create broader category
          const response = await request.post(`${BASE_URL}/api/categories/`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            data: {
              name: category.name,
              description: category.description,
              tracking_type: category.tracking_type
            }
          });

          if (response.ok()) {
            const data = await response.json();
            createdBroaderCategories[category.name] = data.id;
            successCount++;
            console.log(`✅ [${successCount + errorCount}/${categories.length}] Broader: ${category.name} (ID: ${data.id})`);
          } else {
            const errorData = await response.json();
            errorCount++;
            console.log(`❌ [${successCount + errorCount}/${categories.length}] Failed: ${category.name} - ${JSON.stringify(errorData)}`);
          }
        } else {
          // Create subcategory (needs parent ID)
          const parentId = createdBroaderCategories[category.parentName];

          if (!parentId) {
            console.log(`⚠️  [${successCount + errorCount + 1}/${categories.length}] Skipped: ${category.name} - Parent not found`);
            errorCount++;
            continue;
          }

          const subcatData = {
            name: category.name,
            description: category.description,
            parent_category: parentId
          };

          // Add depreciation fields if provided
          if (category.depreciation_rate) {
            subcatData.depreciation_rate = category.depreciation_rate;
            subcatData.depreciation_method = category.depreciation_method;
          }

          const response = await request.post(`${BASE_URL}/api/categories/`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            data: subcatData
          });

          if (response.ok()) {
            const data = await response.json();
            successCount++;
            console.log(`✅ [${successCount + errorCount}/${categories.length}] Sub-category: ${category.name} → ${category.parentName} (ID: ${data.id})`);
          } else {
            const errorData = await response.json();
            errorCount++;
            console.log(`❌ [${successCount + errorCount}/${categories.length}] Failed: ${category.name} - ${JSON.stringify(errorData)}`);
          }
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errorCount++;
        console.log(`❌ [${successCount + errorCount}/${categories.length}] Error: ${category.name} - ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} categories`);
    console.log(`❌ Failed: ${errorCount} categories`);
    console.log(`📈 Total: ${successCount + errorCount} attempts`);
    console.log('='.repeat(60) + '\n');

    // Verify by fetching categories
    console.log('🔍 Verifying categories...');
    const verifyResponse = await request.get(`${BASE_URL}/api/categories/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (verifyResponse.ok()) {
      const allCategories = await verifyResponse.json();
      const totalCount = Array.isArray(allCategories) ? allCategories.length : allCategories.count || 0;
      console.log(`✅ Total categories in system: ${totalCount}`);
    }

    expect(successCount).toBeGreaterThan(0);
  });
});
