# Test Fixtures

This directory contains test data and fixtures for Playwright tests.

## Usage

Create fixture files here for:
- Mock API responses
- Test user credentials
- Sample data objects
- Shared test state

Example structure:
```javascript
// fixtures/users.js
export const testUsers = {
  admin: {
    username: 'admin',
    password: 'admin123'
  },
  locationHead: {
    username: 'location_head',
    password: 'pass123'
  }
};
```

Then import in tests:
```javascript
import { testUsers } from '../fixtures/users.js';
```
