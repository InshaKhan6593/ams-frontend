# Test Utilities

This directory contains helper functions and utilities for Playwright tests.

## Purpose

Share common test logic:
- Login helpers
- Navigation utilities
- Data creation helpers
- API request wrappers
- Custom matchers

Example:
```javascript
// utils/auth.js
export async function loginAsAdmin(page) {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}
```

Then use in tests:
```javascript
import { loginAsAdmin } from '../utils/auth.js';

test('admin can access dashboard', async ({ page }) => {
  await loginAsAdmin(page);
  // ... rest of test
});
```
