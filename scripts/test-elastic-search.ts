
// Polyfill localStorage for Node environment
if (typeof localStorage === "undefined" || localStorage === null) {
  (global as any).localStorage = {
    _data: {} as Record<string, string>,
    setItem: function(id: string, val: string) { return this._data[id] = String(val); },
    getItem: function(id: string) { return Object.prototype.hasOwnProperty.call(this._data, id) ? this._data[id] : null; },
    removeItem: function(id: string) { return delete this._data[id]; },
    clear: function() { return this._data = {}; }
  };
}

import { authService } from '../src/services/authService';
import { configService } from '../src/services/configService';
import { crmService } from '../src/services/crmService';

// ANSI Color Codes
const colors = {
  reset: "\x1b[0m",
  success: "\x1b[32m", // Green
  error: "\x1b[31m",   // Red
  info: "\x1b[36m",    // Cyan
  header: "\x1b[34m",  // Blue
  warn: "\x1b[33m"     // Yellow
};

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runElasticTests() {
  console.log(`${colors.header}Starting Elastic Search Service Verification...${colors.reset}`);
  
  // 1. Test Login (Superadmin)
  console.log(`\n${colors.header}--- Testing Authentication ---${colors.reset}`);
  const email = 'superadmin@solar.com'; 
  const password = 'password123'; 
  
  let locationId: string | undefined;

  try {
    console.log(`${colors.info}Attempting login for ${email}...${colors.reset}`);
    const loginResponse = await authService.loginStaff(email, password);
    const userEmail = loginResponse.user ? loginResponse.user.email : (loginResponse.staff ? loginResponse.staff.email : 'No user data');
    console.log(`${colors.success}✔ Login successful: ${userEmail}${colors.reset}`);
    
    if (!loginResponse.token) {
      throw new Error("No token received");
    }
  } catch (error: any) {
    console.error(`${colors.error}✖ Login failed: ${error.message}${colors.reset}`);
    return;
  }

  // 2. Fetch Location
  try {
    console.log(`\n${colors.header}--- Fetching Location ---${colors.reset}`);
    const locations = await configService.getLocations();
    if (locations.length > 0) {
      locationId = locations[0].location_id;
      console.log(`${colors.success}✔ Using Location ID: ${locationId}${colors.reset}`);
    } else {
        console.warn(`${colors.warn}No locations found. Some tests might fail if they require locationId.${colors.reset}`);
    }
  } catch (error: any) {
    console.error(`${colors.error}✖ Location fetch failed: ${error.message}${colors.reset}`);
  }

  // 3. Reindex All (or specifically leads/accounts)
  try {
    console.log(`\n${colors.header}--- Testing Reindexing ---${colors.reset}`);

    // Reindex Leads
    console.log(`${colors.info}Reindexing Leads...${colors.reset}`);
    await crmService.reindexLeads(locationId);
    console.log(`${colors.success}✔ Reindex Leads request successful${colors.reset}`);
    
    // Reindex All (Cron)
    console.log(`${colors.info}Reindexing All Data (Cron Simulator)...${colors.reset}`);
    await crmService.reindexAll(locationId);
    console.log(`${colors.success}✔ Reindex All request successful${colors.reset}`);

    // Wait a bit for indexing to potentially happen (if async backend)
    console.log(`${colors.info}Waiting 2 seconds for indexing...${colors.reset}`);
    await wait(2000);

  } catch (error: any) {
    console.error(`${colors.error}✖ Reindexing failed: ${error.message}${colors.reset}`);
  }

  // 4. Search Leads
  try {
    console.log(`\n${colors.header}--- Testing Search Leads ---${colors.reset}`);
    // Search for something generic or "test"
    const query = "test"; 
    console.log(`${colors.info}Searching leads for query: "${query}"...${colors.reset}`);
    const leads = await crmService.searchLeads(query, undefined, locationId);
    
    // Check if result is array or object with data
    const results = Array.isArray(leads) ? leads : (leads as any).data || [];
    console.log(`${colors.success}✔ Search Leads returned ${results.length} results.${colors.reset}`);
    
  } catch (error: any) {
    console.error(`${colors.error}✖ Search Leads failed: ${error.message}${colors.reset}`);
  }

  // 5. Search Accounts (and Profiles)
  try {
    console.log(`\n${colors.header}--- Testing Search Accounts ---${colors.reset}`);
    const query = "test";
    console.log(`${colors.info}Searching accounts for query: "${query}"...${colors.reset}`);
    const accounts = await crmService.searchAccounts(query, locationId);
    
    const results = Array.isArray(accounts) ? accounts : (accounts as any).data || [];
    console.log(`${colors.success}✔ Search Accounts returned ${results.length} results.${colors.reset}`);

  } catch (error: any) {
    console.error(`${colors.error}✖ Search Accounts failed: ${error.message}${colors.reset}`);
  }

  console.log(`\n${colors.header}Elastic Service Tests Completed.${colors.reset}`);
}

runElasticTests();
