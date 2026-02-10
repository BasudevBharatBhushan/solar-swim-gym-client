
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

const colors = {
  reset: "\x1b[0m",
  success: "\x1b[32m",
  header: "\x1b[34m",
  error: "\x1b[31m",
  warn: "\x1b[33m",
};

import { configService } from '../src/services/configService';

async function verifyAccounts() {
  console.log(`${colors.header}Starting Account Verification...${colors.reset}`);

  let locationId: string | undefined;
  let newAccountId = '';
  const timestamp = Date.now();
  const newEmail = `verify.${timestamp}@test.com`;

  try {
    // 1. Authenticate
    const email = 'priya@kibizsystems.com';
    const password = '123456';
    
    console.log(`Logging in as ${email}...`);
    const loginResponse = await authService.loginStaff(email, password);
    if (!loginResponse.token) throw new Error("No token received");
    console.log(`${colors.success}✔ Login successful.${colors.reset}`);

    // 2. Get Location
    // console.log(`Fetching locations...`);
    // const locations = await configService.getLocations();
    // if (locations && locations.length > 0) {
    //     locationId = locations[0].location_id || locations[0].id;
    //     console.log(`${colors.success}✔ Using Location: ${locations[0].name} (${locationId})${colors.reset}`);
    // } else {
    //     console.log(`${colors.warn}⚠ No locations found. Proceeding without locationId.${colors.reset}`);
    // }
    
    // Hardcode user provided location
    locationId = "490f7013-a95d-4664-b750-1ecbb98bd463";
    console.log(`${colors.success}✔ Using Hardcoded Location: ${locationId}${colors.reset}`);

    // 3. Register New Account
    console.log(`Registering new test account...`);
    try {
        const regData = await authService.registerUser({
            location_id: locationId,
            primary_profile: {
                first_name: "Verify",
                last_name: "User",
                email: newEmail,
                date_of_birth: "1990-01-01",
                emergency_contact_name: "EC",
                emergency_contact_phone: "555-0000"
            },
            family_members: []
        });
        
        newAccountId = regData.account_id || (regData.data ? regData.data.account_id : '');
        if (newAccountId) {
             console.log(`${colors.success}✔ Registered new account: ${newAccountId} (${newEmail})${colors.reset}`);
        } else {
             console.log(`${colors.error}✖ Registration failed to return account_id.${colors.reset}`);
             console.log(JSON.stringify(regData, null, 2));
        }
    } catch (e: any) {
        console.error(`Registration failed: ${e.message}`);
    }

    // 4. Verify Account Details
    if (newAccountId) {
        console.log(`Fetching Account Details for NEW ID ${newAccountId}...`);
        try {
            const detailResponse = await crmService.getAccountDetails(newAccountId, locationId);
            console.log(`${colors.header}Response from getAccountDetails:${colors.reset}`);
            console.log(JSON.stringify(detailResponse, null, 2));
        } catch (e: any) {
            console.error(`Failed to get details: ${e.message}`);
        }

        // 5. Search by Name (User Provided Example)
        const searchQuery = "deb";
        console.log(`Searching accounts (q=${searchQuery})...`);
        const searchRes = await crmService.searchAccounts({ q: searchQuery, locationId });
        console.log(JSON.stringify(searchRes, null, 2));
        
        let profileId = '';
        const results = Array.isArray(searchRes) ? searchRes : (searchRes.results || []);
        
        // Try to find profile_id in the search results
        if (results.length > 0) {
            const firstResult = results[0];
            if (firstResult.profiles && firstResult.profiles.length > 0) {
                // Find 'Debasis' profile specifically if possible, or just take first
                const debProfile = firstResult.profiles.find((p: any) => p.first_name === 'Debasis');
                profileId = debProfile ? debProfile.profile_id : firstResult.profiles[0].profile_id;
            } else if (firstResult.primary_profile && firstResult.primary_profile.profile_id) {
                profileId = firstResult.primary_profile.profile_id;
            }
        }

        // 6. Test GET Profile
        if (profileId) {
            console.log(`Fetching profile ${profileId}...`);
            const profileRes = await crmService.getProfile(profileId, locationId);
            console.log(`${colors.header}Profile Details:${colors.reset}`);
            console.log(JSON.stringify(profileRes, null, 2));
        } else {
            console.log(`${colors.warn}Could not find profile ID to test getProfile.${colors.reset}`);
        }

        // 7. Test Hardcoded Profile (User Provided)
        const hardcodedProfileId = "29fd0fa4-a162-4968-adee-23f14a1cc800";
        console.log(`Fetching hardcoded profile ${hardcodedProfileId}...`);
        try {
            const profileRes = await crmService.getProfile(hardcodedProfileId, locationId);
            console.log(`${colors.header}Hardcoded Profile Details:${colors.reset}`);
            console.log(JSON.stringify(profileRes, null, 2));
        } catch (e: any) {
            console.error(`Failed to fetch hardcoded profile: ${e.message}`);
        }
    }

  } catch (error: any) {
    console.error(`${colors.error}✖ Verification failed: ${error.message}${colors.reset}`);
    if (error.response) console.log(JSON.stringify(error.response.data));
  }
}


verifyAccounts();
