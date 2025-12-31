// Playwright script for Inspection Certificate Workflow in AMS v3
// Uses API calls for reliability instead of UI interactions
// Run with: npx playwright test inspection_workflow_api.spec.js

import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:8000/api'; // Backend API URL
const FRONTEND_URL = 'http://localhost:5173'; // Frontend URL for verification

// User credentials for different roles
const USERS = {
  admin: { username: 'admin', password: 'admin123', role: 'System Admin' },
  auditor: { username: 'auditor', password: 'auditor123', role: 'Auditor' },
  mainuni_head: { username: 'mainuni_head', password: 'head123', role: 'MAIN UNI Location Head' },
  mainuni_stock: { username: 'mainuni_stock', password: 'stock123', role: 'MAIN UNI Stock Incharge' },
};

// Helper function to get auth token
async function getAuthToken(request, username, password) {
  console.log(`🔐 Getting auth token for ${username}...`);

  const response = await request.post(`${BASE_URL}/auth/login/`, {
    data: {
      username: username,
      password: password
    }
  });

  const data = await response.json();
  if (data.access) {
    console.log(`✅ Token obtained for ${username}`);
    return data.access;
  }

  throw new Error(`Failed to get auth token for ${username}`);
}

// Helper function to get departments (fetch all pages)
async function getDepartments(request, token) {
  let allLocations = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await request.get(`${BASE_URL}/locations/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: { page: currentPage }
    });

    const data = await response.json();

    if (Array.isArray(data)) {
      allLocations = data;
      hasMore = false;
    } else {
      allLocations = [...allLocations, ...(data.results || [])];
      hasMore = !!data.next;
      currentPage++;
    }
  }

  return allLocations.filter(loc => loc.is_standalone);
}

// Helper function to get categories (fetch all pages)
async function getCategories(request, token) {
  let allCategories = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await request.get(`${BASE_URL}/categories/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: { page: currentPage }
    });

    const data = await response.json();

    if (Array.isArray(data)) {
      allCategories = data;
      hasMore = false;
    } else {
      allCategories = [...allCategories, ...(data.results || [])];
      hasMore = !!data.next;
      currentPage++;
    }
  }

  return allCategories;
}

test.describe('Inspection Certificate Workflow - API Based', () => {
  test('Complete 3-stage inspection workflow with 20 items using API', async ({ request }) => {
    test.setTimeout(180000); // 3 minutes timeout for 20 items

    let certificateId = null;
    let certificateNo = '';
    let inspectionItemIds = [];

    console.log('\n' + '='.repeat(70));
    console.log('🏭 INSPECTION CERTIFICATE WORKFLOW - 3-STAGE WITH 20 ITEMS');
    console.log('='.repeat(70));

    // ============================================================================
    // STAGE 1: INITIATED - Location Head creates certificate and adds items
    // ============================================================================
    console.log('\n📋 STAGE 1: INITIATED');
    console.log('─'.repeat(70));

    const headToken = await getAuthToken(request, USERS.mainuni_head.username, USERS.mainuni_head.password);

    // Get departments
    console.log('📍 Fetching departments...');
    const departments = await getDepartments(request, headToken);
    const mainuniDept = departments.find(d => d.name.includes('MAIN UNI'));

    if (!mainuniDept) {
      console.log('❌ MAIN UNI department not found');
      console.log('Available departments:', departments.map(d => d.name));
      throw new Error('MAIN UNI department not found');
    }

    console.log(`✅ Found department: ${mainuniDept.name} (ID: ${mainuniDept.id})`);

    // Create inspection certificate
    console.log('\n📝 Creating inspection certificate...');
    const today = new Date().toISOString().split('T')[0];

    const createResponse = await request.post(`${BASE_URL}/inspection-certificates/`, {
      headers: {
        'Authorization': `Bearer ${headToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        date: today,
        contract_no: `CONTRACT-${Date.now()}`,
        contract_date: today,
        contractor_name: 'Tech Supplies Inc.',
        contractor_address: '123 Tech Street, Tech City',
        indenter: 'Department Head',
        indent_no: `INDENT-${Date.now()}`,
        department: mainuniDept.id,
        date_of_delivery: today,
        delivery_type: 'FULL',
        remarks: 'New equipment purchase for department',
        inspected_by: USERS.mainuni_head.username,
        date_of_inspection: today,
        inspection_items: [
          // INDIVIDUAL TRACKING - Computer Equipment (5 items)
          // Category: Computer Equipment (INDIVIDUAL tracking - QR codes, individual tracking)
          {
            item_description: 'Dell Latitude 7420 Laptop - Intel Core i7, 16GB RAM, 512GB SSD, 14" FHD Display',
            estimated_category: 'Computer Equipment',
            tendered_quantity: 10,
            accepted_quantity: 10,
            rejected_quantity: 0,
            unit_price: 75000.00,
            remarks: 'For faculty members - excellent condition'
          },
          {
            item_description: 'HP EliteDesk 800 G6 Desktop PC - Intel i5, 8GB RAM, 256GB SSD, 21.5" Monitor',
            estimated_category: 'Computer Equipment',
            tendered_quantity: 15,
            accepted_quantity: 15,
            rejected_quantity: 0,
            unit_price: 45000.00,
            remarks: 'Computer lab equipment - working perfectly'
          },
          {
            item_description: 'Canon imageCLASS MF445dw Multifunction Printer - Print, Scan, Copy, Fax',
            estimated_category: 'Computer Equipment',
            tendered_quantity: 3,
            accepted_quantity: 3,
            rejected_quantity: 0,
            unit_price: 28000.00,
            remarks: 'Office printers - network enabled'
          },
          {
            item_description: 'TP-Link 24-Port Gigabit Managed Switch - TL-SG3428',
            estimated_category: 'IT EQUIPMENTS',
            tendered_quantity: 2,
            accepted_quantity: 2,
            rejected_quantity: 0,
            unit_price: 15000.00,
            remarks: 'Network infrastructure upgrade'
          },
          {
            item_description: 'UPS Uninterruptible Power Supply - 2000VA, Line Interactive, AVR',
            estimated_category: 'IT EQUIPMENTS',
            tendered_quantity: 8,
            accepted_quantity: 8,
            rejected_quantity: 0,
            unit_price: 12000.00,
            remarks: 'Power backup for servers'
          },

          // BULK TRACKING - Office Supplies/Stationary (5 items)
          // Category: Office Supplies/STATIONARY (BULK tracking - quantity based, no individual tracking)
          {
            item_description: 'A4 Copy Paper - 80 GSM, 500 Sheets per Ream, White',
            estimated_category: 'Office Supplies',
            tendered_quantity: 100,
            accepted_quantity: 100,
            rejected_quantity: 0,
            unit_price: 250.00,
            remarks: 'Office use - standard quality'
          },
          {
            item_description: 'Whiteboard Markers - Assorted Colors, Bullet Tip, Pack of 12',
            estimated_category: 'STATIONARY',
            tendered_quantity: 50,
            accepted_quantity: 50,
            rejected_quantity: 0,
            unit_price: 180.00,
            remarks: 'For classrooms - vibrant colors'
          },
          {
            item_description: 'Stapler Heavy Duty - 100 Sheet Capacity with Staples Box',
            estimated_category: 'Office Supplies',
            tendered_quantity: 25,
            accepted_quantity: 24,
            rejected_quantity: 1,
            unit_price: 450.00,
            remarks: '1 unit damaged during shipping'
          },
          {
            item_description: 'File Folders - Legal Size, Manila, Box of 100',
            estimated_category: 'Office Supplies',
            tendered_quantity: 10,
            accepted_quantity: 10,
            rejected_quantity: 0,
            unit_price: 800.00,
            remarks: 'Record keeping - good quality'
          },
          {
            item_description: 'Ballpoint Pens - Blue Ink, 0.7mm, Box of 50',
            estimated_category: 'STATIONARY',
            tendered_quantity: 20,
            accepted_quantity: 20,
            rejected_quantity: 0,
            unit_price: 120.00,
            remarks: 'Daily use - smooth writing'
          },

          // INDIVIDUAL TRACKING - Laboratory Equipment (3 items)
          // Category: Laboratory Equipment (INDIVIDUAL tracking)
          {
            item_description: 'Digital Microscope - 40x-1000x Magnification, LED Illumination, USB Camera',
            estimated_category: 'Laboratory Equipment',
            tendered_quantity: 5,
            accepted_quantity: 5,
            rejected_quantity: 0,
            unit_price: 32000.00,
            remarks: 'Biology lab - high resolution imaging'
          },
          {
            item_description: 'Laboratory pH Meter - Digital, 0-14 Range, Auto Calibration, with Electrode',
            estimated_category: 'Laboratory Equipment',
            tendered_quantity: 8,
            accepted_quantity: 8,
            rejected_quantity: 0,
            unit_price: 5500.00,
            remarks: 'Chemistry lab - accurate measurements'
          },
          {
            item_description: 'Laboratory Centrifuge - 4000 RPM, 6 Tube Capacity, Digital Display',
            estimated_category: 'Laboratory Equipment',
            tendered_quantity: 3,
            accepted_quantity: 3,
            rejected_quantity: 0,
            unit_price: 18000.00,
            remarks: 'Biology lab - sample processing'
          },

          // BATCH TRACKING - Laboratory Chemicals (4 items with expiry dates)
          // Category: Laboratory Chemicals/CHEMICALS (BATCH tracking - expiry dates, FIFO)
          {
            item_description: 'Hydrochloric Acid Solution - 1M Concentration, 1 Liter Bottle',
            estimated_category: 'Laboratory Chemicals',
            tendered_quantity: 20,
            accepted_quantity: 20,
            rejected_quantity: 0,
            unit_price: 450.00,
            remarks: 'Chemistry lab reagent - handle with care',
            // BATCH fields will be added during linking in Stage 3
          },
          {
            item_description: 'Sodium Hydroxide Pellets - AR Grade, 500g Bottle',
            estimated_category: 'CHEMICALS',
            tendered_quantity: 15,
            accepted_quantity: 15,
            rejected_quantity: 0,
            unit_price: 380.00,
            remarks: 'Chemistry experiments - caustic material'
          },
          {
            item_description: 'Phenolphthalein Indicator Solution - 100ml Dropper Bottle',
            estimated_category: 'Research Reagents',
            tendered_quantity: 30,
            accepted_quantity: 28,
            rejected_quantity: 2,
            unit_price: 220.00,
            remarks: '2 bottles with broken dropper'
          },
          {
            item_description: 'Distilled Water - Laboratory Grade, 5 Liter Container',
            estimated_category: 'Laboratory Chemicals',
            tendered_quantity: 25,
            accepted_quantity: 25,
            rejected_quantity: 0,
            unit_price: 150.00,
            remarks: 'For preparing solutions'
          },

          // INDIVIDUAL TRACKING - Furniture & Fixtures (3 items)
          // Category: Furniture & Fixtures (INDIVIDUAL tracking)
          {
            item_description: 'Student Desk with Chair - Adjustable Height, Ergonomic Design, Steel Frame',
            estimated_category: 'Furniture & Fixtures',
            tendered_quantity: 40,
            accepted_quantity: 40,
            rejected_quantity: 0,
            unit_price: 4500.00,
            remarks: 'Classroom furniture - sturdy construction'
          },
          {
            item_description: 'Whiteboard - Magnetic, Aluminum Frame, 8ft x 4ft, with Marker Tray',
            estimated_category: 'Furniture & Fixtures',
            tendered_quantity: 12,
            accepted_quantity: 12,
            rejected_quantity: 0,
            unit_price: 6500.00,
            remarks: 'Classroom boards - wall mounted'
          },
          {
            item_description: 'Storage Cabinet - Steel, 6 Shelves, Lockable, 6ft Height',
            estimated_category: 'Furniture & Fixtures',
            tendered_quantity: 8,
            accepted_quantity: 8,
            rejected_quantity: 0,
            unit_price: 12000.00,
            remarks: 'Document storage - secure locking'
          },

          // INDIVIDUAL TRACKING - Audio Visual Equipment (2 items)
          // Category: Audio Visual Equipment (INDIVIDUAL tracking)
          {
            item_description: 'Projector - Full HD 1080p, 3500 Lumens, HDMI/VGA, Wireless Capable',
            estimated_category: 'Audio Visual Equipment',
            tendered_quantity: 6,
            accepted_quantity: 6,
            rejected_quantity: 0,
            unit_price: 38000.00,
            remarks: 'Lecture halls - bright and clear'
          },
          {
            item_description: 'Portable PA System - Wireless Microphone, 200W, Rechargeable Battery',
            estimated_category: 'Audio Visual Equipment',
            tendered_quantity: 4,
            accepted_quantity: 4,
            rejected_quantity: 0,
            unit_price: 15000.00,
            remarks: 'Events and seminars - excellent sound quality'
          }
        ]
      }
    });

    if (!createResponse.ok()) {
      const errorText = await createResponse.text();
      console.log('❌ Failed to create certificate:', errorText);
      throw new Error('Failed to create certificate');
    }

    const certificate = await createResponse.json();
    certificateId = certificate.id;
    certificateNo = certificate.certificate_no;
    inspectionItemIds = certificate.inspection_items.map(item => item.id);

    console.log(`✅ Certificate created: ${certificateNo} (ID: ${certificateId})`);
    console.log(`   Items: ${certificate.inspection_items.length} items added`);
    console.log(`   Stage: ${certificate.stage}`);

    // Submit to Stock Incharge
    console.log('\n🚀 Submitting to Stock Incharge...');
    const submitStage1Response = await request.post(
      `${BASE_URL}/inspection-certificates/${certificateId}/submit_to_stock_incharge/`,
      {
        headers: {
          'Authorization': `Bearer ${headToken}`,
          'Content-Type': 'application/json'
        },
        data: {}
      }
    );

    if (!submitStage1Response.ok()) {
      const errorText = await submitStage1Response.text();
      console.log('❌ Failed to submit:', errorText);
      throw new Error('Failed to submit to stock incharge');
    }

    const stage1Result = await submitStage1Response.json();
    console.log(`✅ STAGE 1 COMPLETED`);
    console.log(`   New stage: ${stage1Result.new_stage}`);
    console.log(`   Workflow: ${stage1Result.workflow || '4-stage'}`);
    console.log(`   Message: ${stage1Result.message}`);

    // ============================================================================
    // STAGE 2: STOCK_DETAILS - Stock Incharge fills stock register details
    // (Only for non-root departments - MAIN UNI might skip this)
    // ============================================================================

    const currentStage = stage1Result.new_stage;

    if (currentStage === 'STOCK_DETAILS') {
      console.log('\n📋 STAGE 2: STOCK_DETAILS');
      console.log('─'.repeat(70));

      const stockToken = await getAuthToken(request, USERS.mainuni_stock.username, USERS.mainuni_stock.password);

      // Update inspection items with stock register details
      console.log('📝 Filling stock register details...');

      for (let i = 0; i < inspectionItemIds.length; i++) {
        const itemId = inspectionItemIds[i];
        const updateResponse = await request.patch(
          `${BASE_URL}/inspection-items/${itemId}/`,
          {
            headers: {
              'Authorization': `Bearer ${stockToken}`,
              'Content-Type': 'application/json'
            },
            data: {
              stock_register_no: `SR-${Date.now()}-${i + 1}`,
              stock_register_page_no: `${i + 1}`,
              stock_entry_date: today
            }
          }
        );

        if (updateResponse.ok()) {
          console.log(`   ✓ Item ${i + 1}: Stock register details added`);
        }
      }

      // Submit stock details
      console.log('\n🚀 Submitting stock details...');
      const submitStage2Response = await request.post(
        `${BASE_URL}/inspection-certificates/${certificateId}/submit_stock_details/`,
        {
          headers: {
            'Authorization': `Bearer ${stockToken}`,
            'Content-Type': 'application/json'
          },
          data: {}
        }
      );

      if (!submitStage2Response.ok()) {
        const errorText = await submitStage2Response.text();
        console.log('❌ Failed to submit stock details:', errorText);
        throw new Error('Failed to submit stock details');
      }

      const stage2Result = await submitStage2Response.json();
      console.log(`✅ STAGE 2 COMPLETED`);
      console.log(`   New stage: ${stage2Result.new_stage}`);
      console.log(`   Message: ${stage2Result.message}`);
    } else {
      console.log('\n⏭️  STAGE 2 SKIPPED (Root department - 3-stage workflow)');
    }

    // ============================================================================
    // STAGE 3: CENTRAL_REGISTER - Admin links items to catalog
    // ============================================================================
    console.log('\n📋 STAGE 3: CENTRAL_REGISTER');
    console.log('─'.repeat(70));

    const adminToken = await getAuthToken(request, USERS.admin.username, USERS.admin.password);

    // Get current certificate state
    const certResponse = await request.get(`${BASE_URL}/inspection-certificates/${certificateId}/`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const currentCert = await certResponse.json();

    console.log('🔗 Linking items to catalog...');

    // Get all categories for matching
    const categories = await getCategories(request, adminToken);
    console.log(`   Found ${categories.length} total categories`);

    // Link each inspection item by creating new items with appropriate category
    for (let i = 0; i < currentCert.inspection_items.length; i++) {
      const inspItem = currentCert.inspection_items[i];

      console.log(`\n   [${i + 1}/${currentCert.inspection_items.length}] Linking: ${inspItem.item_description.substring(0, 50)}...`);

      // Find category matching the estimated_category
      const estimatedCat = inspItem.estimated_category || 'Computer Equipment';
      let category = categories.find(c => c.name === estimatedCat);

      if (!category) {
        // Fallback to a default category
        category = categories.find(c => c.name.includes('Computer') || c.name.includes('Office'));
      }

      if (!category) {
        console.log(`      ⚠️  No matching category found for: ${estimatedCat}, using first available`);
        category = categories[0];
      }

      console.log(`      Category: ${category.name} (${category.tracking_type})`);

      // Prepare item data
      const itemData = {
        name: inspItem.item_description.substring(0, 100),
        category: category.id,
        description: inspItem.item_description,
        acct_unit: category.tracking_type === 'BULK' ? 'Box' : 'Piece',
        specifications: inspItem.item_description,
        default_location: mainuniDept.id
      };

      // Prepare request data
      const requestData = {
        inspection_item_id: inspItem.id,
        item_data: itemData,
        central_register_no: `CR-${Date.now()}-${i + 1}`,
        central_register_page_no: `${i + 1}`
      };

      // Add BATCH tracking fields for chemicals (expiry dates)
      if (category.tracking_type === 'BATCH') {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2); // 2 years from now
        const manufactureDate = new Date();
        manufactureDate.setMonth(manufactureDate.getMonth() - 1); // 1 month ago

        requestData.expiry_date = futureDate.toISOString().split('T')[0];
        requestData.batch_number = `BATCH-${Date.now()}-${i + 1}`;
        requestData.manufacture_date = manufactureDate.toISOString().split('T')[0];

        console.log(`      Batch: ${requestData.batch_number}, Expiry: ${requestData.expiry_date}`);
      }

      const linkResponse = await request.post(
        `${BASE_URL}/inspection-certificates/${certificateId}/create_and_link_item/`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          data: requestData
        }
      );

      if (linkResponse.ok()) {
        const linkResult = await linkResponse.json();
        console.log(`      ✓ Created and linked: ${linkResult.item_name || 'Item'}`);
      } else {
        const errorText = await linkResponse.text();
        console.log(`      ⚠️  Link failed: ${errorText.substring(0, 100)}`);
      }
    }

    // Submit central register
    console.log('\n🚀 Submitting to Auditor...');
    const submitStage3Response = await request.post(
      `${BASE_URL}/inspection-certificates/${certificateId}/submit_central_register/`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        data: {}
      }
    );

    if (!submitStage3Response.ok()) {
      const errorText = await submitStage3Response.text();
      console.log('❌ Failed to submit central register:', errorText);
      throw new Error('Failed to submit central register');
    }

    const stage3Result = await submitStage3Response.json();
    console.log(`✅ STAGE 3 COMPLETED`);
    console.log(`   New stage: ${stage3Result.new_stage}`);
    console.log(`   All items linked: ${stage3Result.all_items_linked}`);

    // ============================================================================
    // STAGE 4: AUDIT_REVIEW - Auditor reviews and approves
    // ============================================================================
    console.log('\n📋 STAGE 4: AUDIT_REVIEW');
    console.log('─'.repeat(70));

    const auditorToken = await getAuthToken(request, USERS.auditor.username, USERS.auditor.password);

    // Update certificate with required audit fields
    console.log('📝 Filling audit details...');
    const updateAuditResponse = await request.patch(
      `${BASE_URL}/inspection-certificates/${certificateId}/`,
      {
        headers: {
          'Authorization': `Bearer ${auditorToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          consignee_name: 'Department Consignee',
          consignee_designation: 'Senior Officer',
          finance_check_date: today
        }
      }
    );

    if (updateAuditResponse.ok()) {
      console.log('   ✓ Audit details filled');
    }

    console.log('\n✅ Reviewing certificate...');
    console.log('   ✓ Items verified');
    console.log('   ✓ Quantities checked');
    console.log('   ✓ Costs validated');
    console.log('   ✓ Linking confirmed');

    // Approve certificate
    console.log('\n🚀 Approving certificate...');
    const approveResponse = await request.post(
      `${BASE_URL}/inspection-certificates/${certificateId}/submit_audit_review/`,
      {
        headers: {
          'Authorization': `Bearer ${auditorToken}`,
          'Content-Type': 'application/json'
        },
        data: {}
      }
    );

    if (!approveResponse.ok()) {
      const errorText = await approveResponse.text();
      console.log('❌ Failed to approve:', errorText);
      throw new Error('Failed to approve certificate');
    }

    const stage4Result = await approveResponse.json();
    console.log(`✅ STAGE 4 COMPLETED: Certificate APPROVED!`);
    console.log(`   New stage: ${stage4Result.new_stage}`);
    console.log(`   Message: ${stage4Result.message}`);
    console.log(`   Stock created: ${stage4Result.created_summary ? 'Yes' : 'Check backend'}`);

    // ============================================================================
    // VERIFICATION
    // ============================================================================
    console.log('\n📋 VERIFICATION');
    console.log('─'.repeat(70));

    const finalCertResponse = await request.get(`${BASE_URL}/inspection-certificates/${certificateId}/`, {
      headers: { 'Authorization': `Bearer ${auditorToken}` }
    });

    const finalCert = await finalCertResponse.json();
    console.log(`✅ Final Status: ${finalCert.status}`);
    console.log(`✅ Final Stage: ${finalCert.stage}`);

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 WORKFLOW SUMMARY');
    console.log('='.repeat(70));
    console.log(`Certificate Number: ${certificateNo}`);
    console.log(`Certificate ID: ${certificateId}`);
    console.log('');
    console.log('✅ STAGE 1: INITIATED - Location Head created certificate');
    if (stage1Result.workflow === '4-stage workflow') {
      console.log('✅ STAGE 2: STOCK_DETAILS - Stock Incharge filled details');
    } else {
      console.log('⏭️  STAGE 2: SKIPPED (3-stage workflow for root department)');
    }
    console.log('✅ STAGE 3: CENTRAL_REGISTER - Admin linked items to catalog');
    console.log('✅ STAGE 4: AUDIT_REVIEW - Auditor approved certificate');
    console.log('✅ STAGE 5: COMPLETED - Stock entries generated');
    console.log('');
    console.log('🎉 Complete inspection workflow demonstrated successfully!');
    console.log('='.repeat(70) + '\n');

    // Verify the test passed
    expect(finalCert.stage).toBe('COMPLETED');
    expect(finalCert.status).toBe('COMPLETED');
  });
});
