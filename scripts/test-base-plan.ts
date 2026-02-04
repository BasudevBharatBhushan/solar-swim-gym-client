
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
import { configService } from '../src/services/configService';
import { basePriceService } from '../src/services/basePriceService';

// ANSI Color Codes
const colors = {
  reset: "\x1b[0m",
  success: "\x1b[32m", // Green
  error: "\x1b[31m",   // Red
  info: "\x1b[36m",    // Cyan
  header: "\x1b[34m",  // Blue
  warn: "\x1b[33m"     // Yellow
};

async function runTests() {
  console.log(`${colors.header}Starting Base Plan API Verification...${colors.reset}`);
  
  const timestamp = Date.now();
  let locationId: string | undefined;
  let ageGroupId: string | undefined;
  let subTermId: string | undefined;

  // 1. Authenticate
  try {
      console.log(`${colors.info}Logging in...${colors.reset}`);
      const loginResponse = await authService.loginStaff('superadmin@solar.com', 'password123');
      const token = loginResponse.token;
      if (!token) throw new Error("No token received");
      console.log(`${colors.success}✔ Login successful${colors.reset}`);
  } catch (error: any) {
      console.error(`${colors.error}✖ Login failed: ${error.message}${colors.reset}`);
      return;
  }

  // 2. Get Location
  try {
      console.log(`${colors.info}Fetching Location...${colors.reset}`);
      const locations = await configService.getLocations();
      if (locations.length > 0) {
          locationId = locations[0].location_id || locations[0].id;
          console.log(`${colors.success}✔ Using Location ID: ${locationId}${colors.reset}`);
      } else {
           console.error(`${colors.error}✖ No locations found. Cannot proceed.${colors.reset}`);
           return;
      }
  } catch (error: any) {
       console.error(`${colors.error}✖ Fetch locations failed: ${error.message}${colors.reset}`);
       return;
  }

  // 3. Get Config (Age Groups & Terms) for dependencies
  try {
      console.log(`${colors.info}Fetching Config Dependencies...${colors.reset}`);
      const ageGroups = await configService.getAgeGroups();
      const terms = await configService.getSubscriptionTerms(locationId!);
      
      if (ageGroups.length > 0) ageGroupId = ageGroups[0].age_group_id || ageGroups[0].id;
      if (terms.length > 0) subTermId = terms[0].subscription_term_id || terms[0].id;

      if (!ageGroupId || !subTermId) {
          console.warn(`${colors.warn}⚠ Missing AgeGroup or SubscriptionTerm. Might create new ones if I could, but for now relying on existing.${colors.reset}`);
          // If purely existing, we stop if none found.
          if(!ageGroupId) console.error("No Age Group found");
          if(!subTermId) console.error("No Subscription Term found");
          if(!ageGroupId || !subTermId) return;
      } else {
          console.log(`${colors.success}✔ Dependencies found: AgeGroup=${ageGroupId}, Term=${subTermId}${colors.reset}`);
      }
  } catch (error: any) {
       console.error(`${colors.error}✖ Fetch config failed: ${error.message}${colors.reset}`);
       return;
  }

  // 4. Test Base Price API
  try {
      console.log(`\n${colors.header}--- Testing Base Prices ---${colors.reset}`);
      
      // CREATE / UPSERT
      const priceName = `Test Price ${Math.floor(Math.random() * 1000)}`;
      console.log(`${colors.info}Creating Base Price: ${priceName}...${colors.reset}`);
      
      const newPricePayload = {
          location_id: locationId!,
          name: priceName,
          role: 'PRIMARY' as const,
          age_group_id: ageGroupId!,
          subscription_term_id: subTermId!,
          price: 99.99,
          discount: "10%",
          is_active: true
      };

      const createdPrice = await basePriceService.upsert(newPricePayload);
      console.log(`${colors.success}✔ Created/Upserted Base Price:${colors.reset}`, createdPrice);

      // GET LIST
      console.log(`${colors.info}Fetching all base prices for location...${colors.reset}`);
      const priceList = await basePriceService.getAll(locationId!);
      console.log(`${colors.success}✔ Fetched ${priceList.length} base prices.${colors.reset}`);
      
      if (priceList.length > 0) {
          console.log("Sample item from list:", priceList[0]);
      } else {
        console.warn("List is empty even after creation?");
      }

      // UPDATE (Modify price)
      if (createdPrice && (createdPrice.base_price_id || (createdPrice as any).id)) {
          const id = createdPrice.base_price_id || (createdPrice as any).id;
          console.log(`${colors.info}Updating Price for ID ${id}...${colors.reset}`);
          
          const updatePayload = {
              ...createdPrice,
              base_price_id: id,
              price: 150.00
          };
          
          const updatedPrice = await basePriceService.upsert(updatePayload);
          console.log(`${colors.success}✔ Updated Base Price:${colors.reset}`, updatedPrice);
          if (updatedPrice.price === 150.00) {
              console.log(`${colors.success}✔ Price verification passed.${colors.reset}`);
          } else {
              console.error(`${colors.error}✖ Price mismatch: Expected 150.00, got ${updatedPrice.price}${colors.reset}`);
          }
      }

  } catch (error: any) {
      console.error(`${colors.error}✖ Base Price Test Failed: ${error.message}${colors.reset}`);
      if (error.response) {
          console.error(`${colors.error}Response: ${JSON.stringify(error.response.data)}${colors.reset}`);
      }
  }
}

runTests();
