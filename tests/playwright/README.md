# Playwright E2E Tests

This directory contains end-to-end tests for the AMS v3 frontend application.

## Test Structure

```
tests/
├── playwright/          # E2E test files
│   ├── create_categories.spec.js
│   ├── create_locations.spec.js
│   ├── inspection_workflow.spec.js
│   └── inspection_workflow_api.spec.js
├── fixtures/           # Test data and fixtures
└── utils/             # Test helper functions
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in UI mode (interactive)
npm run test:ui

# Run specific test suites
npm run test:create-categories
npm run test:create-locations
npm run test:inspection-workflow

# Show test report
npm run test:report
```

## Test Files

### create_categories.spec.js
Tests for creating and managing categories in the system.

### create_locations.spec.js
Tests for creating locations and location hierarchies.

### inspection_workflow.spec.js
UI-based tests for the inspection certificate workflow.

### inspection_workflow_api.spec.js
API-based tests for the complete inspection workflow including:
- Creating inspection certificates
- Adding items
- Stage transitions
- Approval process

## Configuration

Playwright configuration is in `playwright.config.js` at the project root.

- **Base URL**: http://localhost:8000 (Django backend)
- **Frontend URL**: http://localhost:5173 (Vite dev server)
- **Browser**: Chromium (Chrome)
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure
- **Videos**: Retained on failure

## Prerequisites

Before running tests, ensure:
1. Backend is running: `python manage.py runserver` (port 8000)
2. Frontend is running: `npm run dev` (port 5173)
3. Database has test data: `python manage.py setup_initial_data`

## Writing New Tests

1. Create a new `.spec.js` file in `tests/playwright/`
2. Import test utilities:
   ```javascript
   import { test, expect } from '@playwright/test';
   ```
3. Write test cases following existing patterns
4. Add npm script in package.json for easy execution

## Debugging

```bash
# Run with browser visible
npm run test:headed

# Run in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test tests/playwright/your-test.spec.js
```

## CI/CD

Tests are configured to run in CI environments with:
- 2 retries for flaky tests
- Sequential execution (workers: 1)
- Strict mode (forbidOnly)
