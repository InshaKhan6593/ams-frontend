// Playwright script to create 10 locations in AMS v3 using Frontend UI
// Run with: npx playwright test create_locations.spec.js

import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:5173'; // Frontend URL
const USERNAME = 'admin';
const PASSWORD = 'admin123';

// Location data generator - 10 locations total
function generateLocationData() {
  return [
    // 1. Building under MAIN UNI
    {
      name: 'Main Campus Building A',
      location_type: 'BUILDING',
      is_standalone: false,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Main administration building under MAIN UNI',
      address: '123 University Avenue, Building A',
      in_charge: 'Dr. John Smith',
      contact_number: '+1-555-0101'
    },

    // 2. Additional store under MAIN UNI
    {
      name: 'Main Campus Secondary Store',
      location_type: 'STORE',
      is_standalone: false,
      is_store: true,
      parent_location: 'MAIN UNI',
      description: 'Secondary storage facility for main campus',
      address: '123 University Avenue, Store 2',
      in_charge: 'Jane Doe',
      contact_number: '+1-555-0102'
    },

    // 3. Standalone location - Computer Science Department (under MAIN UNI)
    {
      name: 'Computer Science Department',
      location_type: 'DEPARTMENT',
      is_standalone: true,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Computer Science standalone department',
      address: '456 Tech Avenue',
      in_charge: 'Prof. Alan Turing',
      contact_number: '+1-555-0201'
    },

    // 4. Building under CS Department
    {
      name: 'CS Building',
      location_type: 'BUILDING',
      is_standalone: false,
      is_store: false,
      parent_location: 'Computer Science Department',
      description: 'Computer Science main building',
      address: '456 Tech Avenue, CS Building',
      in_charge: 'Dr. Ada Lovelace',
      contact_number: '+1-555-0202'
    },

    // 5. Lab under CS Building
    {
      name: 'CS Research Lab',
      location_type: 'LAB',
      is_standalone: false,
      is_store: true,
      parent_location: 'CS Building',
      description: 'Computer Science research laboratory',
      address: '456 Tech Avenue, Lab 101'
    },

    // 6. Standalone location - Physics Department (under MAIN UNI)
    {
      name: 'Physics Department',
      location_type: 'DEPARTMENT',
      is_standalone: true,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Physics standalone department',
      address: '789 Science Road',
      in_charge: 'Prof. Albert Einstein',
      contact_number: '+1-555-0301'
    },

    // 7. Store under Physics Department
    {
      name: 'Physics Equipment Store',
      location_type: 'STORE',
      is_standalone: false,
      is_store: true,
      parent_location: 'Physics Department',
      description: 'Storage for physics lab equipment',
      address: '789 Science Road, Store Room',
      in_charge: 'Dr. Marie Curie',
      contact_number: '+1-555-0302'
    },

    // 8. Standalone location - Chemistry Department (under MAIN UNI)
    {
      name: 'Chemistry Department',
      location_type: 'DEPARTMENT',
      is_standalone: true,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Chemistry standalone department',
      address: '321 Chemical Lane',
      in_charge: 'Prof. Dmitri Mendeleev',
      contact_number: '+1-555-0401'
    },

    // 9. Building under Chemistry Department
    {
      name: 'Chemistry Research Building',
      location_type: 'BUILDING',
      is_standalone: false,
      is_store: false,
      parent_location: 'Chemistry Department',
      description: 'Main chemistry research facility',
      address: '321 Chemical Lane, Building A'
    },

    // 10. Lab/Store under Chemistry Research Building
    {
      name: 'Hazardous Materials Storage',
      location_type: 'LAB',
      is_standalone: false,
      is_store: true,
      parent_location: 'Chemistry Research Building',
      description: 'Secure storage for hazardous chemicals',
      address: '321 Chemical Lane, Building A, Room 101',
      in_charge: 'Dr. Linus Pauling',
      contact_number: '+1-555-0402'
    },

    // 11. Standalone - Mathematics Department
    {
      name: 'Mathematics Department',
      location_type: 'DEPARTMENT',
      is_standalone: true,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Mathematics standalone department',
      address: '555 Math Plaza',
      in_charge: 'Prof. Leonhard Euler',
      contact_number: '+1-555-0501'
    },

    // 12. Room under Math Department
    {
      name: 'Mathematics Seminar Room',
      location_type: 'ROOM',
      is_standalone: false,
      is_store: false,
      parent_location: 'Mathematics Department',
      description: 'Main seminar and meeting room',
      address: '555 Math Plaza, Room 201'
    },

    // 13. Store under Math Department
    {
      name: 'Math Equipment Store',
      location_type: 'STORE',
      is_standalone: false,
      is_store: true,
      parent_location: 'Mathematics Department',
      description: 'Storage for mathematical equipment and supplies',
      address: '555 Math Plaza, Store Room',
      in_charge: 'Dr. Emmy Noether',
      contact_number: '+1-555-0502'
    },

    // 14. Standalone - Biology Department
    {
      name: 'Biology Department',
      location_type: 'DEPARTMENT',
      is_standalone: true,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Biology standalone department',
      address: '777 Life Science Avenue',
      in_charge: 'Prof. Charles Darwin',
      contact_number: '+1-555-0601'
    },

    // 15. Building under Biology
    {
      name: 'Biology Research Center',
      location_type: 'BUILDING',
      is_standalone: false,
      is_store: false,
      parent_location: 'Biology Department',
      description: 'Main biology research facility',
      address: '777 Life Science Avenue, Building A'
    },

    // 16. Lab under Biology Research Center
    {
      name: 'Molecular Biology Lab',
      location_type: 'LAB',
      is_standalone: false,
      is_store: true,
      parent_location: 'Biology Research Center',
      description: 'Molecular biology research laboratory',
      address: '777 Life Science Avenue, Lab 301',
      in_charge: 'Dr. Rosalind Franklin',
      contact_number: '+1-555-0602'
    },

    // 17. Lab under Biology Research Center
    {
      name: 'Genetics Lab',
      location_type: 'LAB',
      is_standalone: false,
      is_store: true,
      parent_location: 'Biology Research Center',
      description: 'Genetics and genomics laboratory',
      address: '777 Life Science Avenue, Lab 302',
      in_charge: 'Dr. Gregor Mendel',
      contact_number: '+1-555-0603'
    },

    // 18. Standalone - Engineering Department
    {
      name: 'Engineering Department',
      location_type: 'DEPARTMENT',
      is_standalone: true,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Engineering standalone department',
      address: '888 Engineering Drive',
      in_charge: 'Prof. Nikola Tesla',
      contact_number: '+1-555-0701'
    },

    // 19. Building under Engineering
    {
      name: 'Engineering Workshop',
      location_type: 'BUILDING',
      is_standalone: false,
      is_store: false,
      parent_location: 'Engineering Department',
      description: 'Main engineering workshop and fabrication facility',
      address: '888 Engineering Drive, Workshop Building'
    },

    // 20. Store under Engineering Workshop
    {
      name: 'Engineering Tools Storage',
      location_type: 'STORE',
      is_standalone: false,
      is_store: true,
      parent_location: 'Engineering Workshop',
      description: 'Storage for engineering tools and equipment',
      address: '888 Engineering Drive, Workshop Store',
      in_charge: 'John Smith',
      contact_number: '+1-555-0702'
    },

    // 21. Lab under Engineering
    {
      name: 'Robotics Lab',
      location_type: 'LAB',
      is_standalone: false,
      is_store: true,
      parent_location: 'Engineering Department',
      description: 'Robotics and automation laboratory',
      address: '888 Engineering Drive, Robotics Lab',
      in_charge: 'Dr. Isaac Asimov',
      contact_number: '+1-555-0703'
    },

    // 22. Standalone - Library
    {
      name: 'Central Library',
      location_type: 'BUILDING',
      is_standalone: true,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Main university library',
      address: '999 Library Lane',
      in_charge: 'Dr. Melvil Dewey',
      contact_number: '+1-555-0801'
    },

    // 23. Store under Library
    {
      name: 'Library Equipment Room',
      location_type: 'STORE',
      is_standalone: false,
      is_store: true,
      parent_location: 'Central Library',
      description: 'Storage for library equipment and supplies',
      address: '999 Library Lane, Equipment Room'
    },

    // 24. Office under Library
    {
      name: 'Library Archives Office',
      location_type: 'OFFICE',
      is_standalone: false,
      is_store: false,
      parent_location: 'Central Library',
      description: 'Archives and special collections office',
      address: '999 Library Lane, 3rd Floor'
    },

    // 25. Building under Main Campus
    {
      name: 'Student Center',
      location_type: 'BUILDING',
      is_standalone: false,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Central student activities and services building',
      address: '100 Campus Center Drive'
    },

    // 26. Store under Student Center
    {
      name: 'Student Center Supply Room',
      location_type: 'STORE',
      is_standalone: false,
      is_store: true,
      parent_location: 'Student Center',
      description: 'Storage for student center supplies',
      address: '100 Campus Center Drive, Store Room'
    },

    // 27. AV Hall under Student Center
    {
      name: 'Main Auditorium AV Hall',
      location_type: 'AV_HALL',
      is_standalone: false,
      is_store: false,
      parent_location: 'Student Center',
      description: 'Main audiovisual hall for events',
      address: '100 Campus Center Drive, Hall A'
    },

    // 28. Building under Main Campus
    {
      name: 'Sports Complex',
      location_type: 'BUILDING',
      is_standalone: false,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Athletic facilities and sports center',
      address: '200 Athletic Way'
    },

    // 29. Store under Sports Complex
    {
      name: 'Sports Equipment Storage',
      location_type: 'STORE',
      is_standalone: false,
      is_store: true,
      parent_location: 'Sports Complex',
      description: 'Storage for sports equipment and gear',
      address: '200 Athletic Way, Equipment Room',
      in_charge: 'Coach Mike Johnson',
      contact_number: '+1-555-0901'
    },

    // 30. Office under Sports Complex
    {
      name: 'Athletic Department Office',
      location_type: 'OFFICE',
      is_standalone: false,
      is_store: false,
      parent_location: 'Sports Complex',
      description: 'Administrative office for athletics',
      address: '200 Athletic Way, Admin Office'
    },

    // 31. Building under Main Campus
    {
      name: 'Cafeteria Building',
      location_type: 'BUILDING',
      is_standalone: false,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Main dining hall and food services',
      address: '300 Dining Plaza'
    },

    // 32. Store under Cafeteria
    {
      name: 'Cafeteria Storage',
      location_type: 'STORE',
      is_standalone: false,
      is_store: true,
      parent_location: 'Cafeteria Building',
      description: 'Food and supplies storage',
      address: '300 Dining Plaza, Storage Room',
      in_charge: 'Chef Maria Garcia',
      contact_number: '+1-555-1001'
    },

    // 33. Building under Main Campus
    {
      name: 'Maintenance Building',
      location_type: 'BUILDING',
      is_standalone: false,
      is_store: false,
      parent_location: 'MAIN UNI',
      description: 'Campus maintenance and facilities management',
      address: '400 Service Road'
    },

    // 34. Store under Maintenance Building
    {
      name: 'Maintenance Tools Storage',
      location_type: 'STORE',
      is_standalone: false,
      is_store: true,
      parent_location: 'Maintenance Building',
      description: 'Tools and maintenance equipment storage',
      address: '400 Service Road, Tool Room',
      in_charge: 'Dave Wilson',
      contact_number: '+1-555-1101'
    },

    // 35. Junkyard under Maintenance
    {
      name: 'Campus Junkyard',
      location_type: 'JUNKYARD',
      is_standalone: false,
      is_store: true,
      parent_location: 'Maintenance Building',
      description: 'Storage for obsolete and damaged equipment',
      address: '400 Service Road, Junkyard Area',
      in_charge: 'Tom Anderson',
      contact_number: '+1-555-1102'
    },

    // 36. Additional Lab under Physics
    {
      name: 'Quantum Physics Lab',
      location_type: 'LAB',
      is_standalone: false,
      is_store: true,
      parent_location: 'Physics Department',
      description: 'Quantum mechanics research laboratory',
      address: '789 Science Road, Quantum Lab',
      in_charge: 'Dr. Niels Bohr',
      contact_number: '+1-555-0303'
    },

    // 37. Additional Lab under Chemistry
    {
      name: 'Organic Chemistry Lab',
      location_type: 'LAB',
      is_standalone: false,
      is_store: true,
      parent_location: 'Chemistry Department',
      description: 'Organic chemistry teaching and research lab',
      address: '321 Chemical Lane, Organic Lab',
      in_charge: 'Dr. August Kekulé',
      contact_number: '+1-555-0403'
    },

    // 38. Room under CS Building
    {
      name: 'CS Lecture Hall',
      location_type: 'ROOM',
      is_standalone: false,
      is_store: false,
      parent_location: 'CS Building',
      description: 'Main lecture hall for computer science classes',
      address: '456 Tech Avenue, Hall 201'
    },

    // 39. Additional Store under Biology
    {
      name: 'Biology Specimen Storage',
      location_type: 'STORE',
      is_standalone: false,
      is_store: true,
      parent_location: 'Biology Department',
      description: 'Storage for biological specimens and samples',
      address: '777 Life Science Avenue, Specimen Room',
      in_charge: 'Dr. Jane Goodall',
      contact_number: '+1-555-0604'
    },

    // 40. Auditorium under Student Center
    {
      name: 'Grand Auditorium',
      location_type: 'AUDITORIUM',
      is_standalone: false,
      is_store: false,
      parent_location: 'Student Center',
      description: 'Large auditorium for university events',
      address: '100 Campus Center Drive, Auditorium'
    }
  ];
}

test.describe('Create 40 Locations in AMS v3', () => {
  test('Should login and create 40 locations using frontend UI', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes timeout for creating 40 locations
    console.log('\n🔐 Step 1: Logging in...');

    // Step 1: Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Step 2: Fill login form
    await page.fill('input[name="username"], input[type="text"]', USERNAME);
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);

    // Step 3: Click login button
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    console.log('✅ Login successful!');

    // Step 4: Generate location data
    const locations = generateLocationData();
    console.log(`\n📍 Step 2: Preparing to create ${locations.length} locations...`);
    console.log(`   - Standalone locations: ${locations.filter(l => l.is_standalone).length}`);
    console.log(`   - Child locations: ${locations.filter(l => !l.is_standalone).length}`);
    console.log(`   - Stores: ${locations.filter(l => l.is_store).length}`);
    console.log(`   - Buildings: ${locations.filter(l => l.location_type === 'BUILDING').length}`);

    // Track created locations for parent selection
    const createdLocations = {};

    // Step 5: Create locations one by one
    console.log('\n🚀 Step 3: Creating locations...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];

      try {
        console.log(`\n[${i + 1}/${locations.length}] Creating: ${location.name}`);

        // Navigate to new location page
        await page.goto(`${BASE_URL}/dashboard/locations/new`);
        await page.waitForLoadState('networkidle');

        // Wait for form to be ready
        await page.waitForSelector('input[name="name"]', { timeout: 5000 });

        // Fill location name
        await page.fill('input[name="name"]', location.name);
        console.log(`  ✓ Name: ${location.name}`);

        // Fill location type
        await page.selectOption('select[name="location_type"]', location.location_type);
        console.log(`  ✓ Type: ${location.location_type}`);

        // Select parent location if specified
        if (location.parent_location) {
          try {
            // Wait for parent location dropdown to load
            await page.waitForSelector('select[name="parent_location"]', { timeout: 3000 });
            await page.waitForTimeout(1000); // Let options load completely

            // Get all option texts (format: "Name (CODE)")
            const options = await page.locator('select[name="parent_location"] option').allTextContents();

            // Find option that contains the parent location name
            const matchingOptionText = options.find(opt => opt.includes(location.parent_location));

            if (matchingOptionText) {
              // Select using the text content
              await page.selectOption('select[name="parent_location"]', { label: matchingOptionText.trim() });
              console.log(`  ✓ Parent: ${matchingOptionText.trim()}`);
            } else {
              console.log(`  ⚠️  Parent "${location.parent_location}" not found`);
              console.log(`     Available: ${options.slice(0, 5).join(', ')}`);
            }
          } catch (err) {
            console.log(`  ⚠️  Error selecting parent: ${err.message.substring(0, 100)}`);
          }
        }

        // Set standalone checkbox
        if (location.is_standalone) {
          const isChecked = await page.isChecked('input[name="is_standalone"]');
          if (!isChecked) {
            await page.check('input[name="is_standalone"]');
          }
          console.log(`  ✓ Standalone: Yes`);
        }

        // Set store checkbox
        if (location.is_store) {
          const isChecked = await page.isChecked('input[name="is_store"]');
          if (!isChecked) {
            await page.check('input[name="is_store"]');
          }
          console.log(`  ✓ Store: Yes`);
        }

        // Fill optional fields
        if (location.description) {
          await page.fill('textarea[name="description"], input[name="description"]', location.description);
        }

        if (location.address) {
          await page.fill('input[name="address"], textarea[name="address"]', location.address);
        }

        if (location.in_charge) {
          await page.fill('input[name="in_charge"]', location.in_charge);
        }

        if (location.contact_number) {
          await page.fill('input[name="contact_number"]', location.contact_number);
        }

        // Submit the form
        await page.click('button[type="submit"]');

        // Wait for either success navigation or error message
        try {
          await Promise.race([
            page.waitForURL('**/dashboard/locations', { timeout: 5000 }),
            page.waitForSelector('.text-red-700, .bg-red-50', { timeout: 5000 })
          ]);

          const currentUrl = page.url();
          if (currentUrl.includes('/dashboard/locations') && !currentUrl.includes('/new')) {
            successCount++;
            createdLocations[location.name] = true;
            console.log(`✅ [${successCount + errorCount}/${locations.length}] Created: ${location.name}`);
            // Wait longer after success to ensure location is saved and available for parent selection
            await page.waitForTimeout(1500);
          } else {
            const errorMsg = await page.locator('.text-red-700, .bg-red-50').textContent().catch(() => 'Unknown error');
            errorCount++;
            console.log(`❌ [${successCount + errorCount}/${locations.length}] Failed: ${location.name} - ${errorMsg}`);
          }
        } catch (err) {
          errorCount++;
          console.log(`❌ [${successCount + errorCount}/${locations.length}] Timeout: ${location.name}`);
        }

        // Small delay between attempts
        await page.waitForTimeout(300);

      } catch (error) {
        errorCount++;
        console.log(`❌ [${successCount + errorCount}/${locations.length}] Error: ${location.name} - ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} locations`);
    console.log(`❌ Failed: ${errorCount} locations`);
    console.log(`📈 Total: ${successCount + errorCount} attempts`);
    console.log('='.repeat(60) + '\n');

    // Navigate to locations list to verify
    await page.goto(`${BASE_URL}/dashboard/locations`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('🔍 Verifying locations on the page...');
    const locationCount = await page.locator('table tbody tr').count();
    console.log(`✅ Locations visible in table: ${locationCount}`);

    expect(successCount).toBeGreaterThan(0);
  });
});
