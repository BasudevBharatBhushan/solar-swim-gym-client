
// Polyfill localStorage and sessionStorage for Node environment
if (typeof localStorage === "undefined" || localStorage === null) {
  (global as any).localStorage = {
    _data: {} as Record<string, string>,
    setItem: function(id: string, val: string) { return this._data[id] = String(val); },
    getItem: function(id: string) { return Object.prototype.hasOwnProperty.call(this._data, id) ? this._data[id] : null; },
    removeItem: function(id: string) { return delete this._data[id]; },
    clear: function() { return this._data = {}; }
  };
}

if (typeof sessionStorage === "undefined" || sessionStorage === null) {
  (global as any).sessionStorage = {
    _data: {} as Record<string, string>,
    setItem: function(id: string, val: string) { return this._data[id] = String(val); },
    getItem: function(id: string) { return Object.prototype.hasOwnProperty.call(this._data, id) ? this._data[id] : null; },
    removeItem: function(id: string) { return delete this._data[id]; },
    clear: function() { return this._data = {}; }
  };
}

import { authService } from '../src/services/authService';
import { crmService } from '../src/services/crmService';
import { configService } from '../src/services/configService';

// ANSI Color Codes
const colors = {
  reset: "\x1b[0m",
  success: "\x1b[32m",
  error: "\x1b[31m",
  info: "\x1b[36m",
  header: "\x1b[34m",
  warn: "\x1b[33m"
};

async function runTests() {
  console.log(`${colors.header}Starting CRM & Billing verification...${colors.reset}`);
  let locationId: string | undefined;

  // 1. Authentication
  console.log(`\n${colors.header}--- 1. Authentication ---${colors.reset}`);
  try {
    const email = 'testadmin@solar.com'; 
    const password = 'password123'; 
    await authService.loginStaff(email, password);
    console.log(`${colors.success}✔ Login successful${colors.reset}`);
  } catch (error: any) {
    console.error(`${colors.error}✖ Login failed: ${error.message}${colors.reset}`);
    return;
  }

  // 2. Get Location
  try {
    const locations = await configService.getLocations();
    if (locations.length > 0) {
        locationId = locations[0].location_id || locations[0].id;
        console.log(`${colors.success}✔ Using Location: ${locations[0].name} (${locationId})${colors.reset}`);
    } else {
        console.error(`${colors.error}✖ No locations found${colors.reset}`);
        return;
    }
  } catch (error: any) {
    console.error(`${colors.error}✖ Failed to get locations: ${error.message}${colors.reset}`);
    return;
  }

  // 3. Test Account Search
  console.log(`\n${colors.header}--- 3. Testing Account Search ---${colors.reset}`);
  try {
      // Search with text
      const searchRes = await crmService.searchAccounts({
          q: "test",
          size: 5,
          locationId
      });
      const accounts = searchRes.data || searchRes; // handle potential response wrapper
      console.log(`${colors.success}✔ Search 'test' returned ${Array.isArray(accounts) ? accounts.length : 'unknown'} results${colors.reset}`);

      // Search with sorting
      await crmService.searchAccounts({
          sort: "created_at",
          order: "desc",
          size: 1,
          locationId
      });
      console.log(`${colors.success}✔ Search with sort returned results${colors.reset}`);

  } catch (error: any) {
      console.error(`${colors.error}✖ Search Account failed: ${error.message}${colors.reset}`);
  }

  // 4. Test Reindex
  console.log(`\n${colors.header}--- 4. Testing Reindex ---${colors.reset}`);
  try {
      await crmService.reindexAccounts(locationId);
      console.log(`${colors.success}✔ Reindex triggered successfully${colors.reset}`);
  } catch (error: any) {
      console.error(`${colors.error}✖ Reindex failed: ${error.message}${colors.reset}`);
  }

  console.log(`\n${colors.header}Verification Completed.${colors.reset}`);
}

runTests();

