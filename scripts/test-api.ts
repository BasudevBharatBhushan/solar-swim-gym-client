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
import { crmService } from '../src/services/crmService';
import { membershipService } from '../src/services/membershipService';
import { serviceCatalog } from '../src/services/serviceCatalog';
import { pricingService } from '../src/services/pricingService';
import { discountService } from '../src/services/discountService';
import { billingService } from '../src/services/billingService';

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
  console.log(`${colors.header}Starting API Verification Tests (CREATE & READ)...${colors.reset}`);
  
  const timestamp = Date.now();
  
  // Variables to store created IDs for subsequent tests
  let locationId: string | undefined;
  let ageGroupId: string | undefined;
  let termId: string | undefined;
  let waiverId: string | undefined;
  let serviceId: string | undefined;
  let accountId: string | undefined;
  let profileId: string | undefined;

  // 1. Test Login (Superadmin)
  console.log(`\n${colors.header}--- 1. Authentication ---${colors.reset}`);
  const email = 'superadmin@solar.com'; 
  const password = 'password123'; 
  
  try {
    console.log(`${colors.info}Attempting login for ${email}...${colors.reset}`);
    const loginResponse = await authService.loginStaff(email, password);
    const userEmail = loginResponse.user ? loginResponse.user.email : (loginResponse.staff ? loginResponse.staff.email : 'No user data');
    console.log(`${colors.success}✔ Login successful: ${userEmail}${colors.reset}`);
    
    if (!loginResponse.token) throw new Error("No token received");
  } catch (error: any) {
    console.error(`${colors.error}✖ Login failed: ${error.message}${colors.reset}`);
    return; // Cannot proceed without token
  }

  // 2. Locations (Create & Get)
  try {
    console.log(`\n${colors.header}--- 2. Locations ---${colors.reset}`);
    
    // Create
    console.log(`${colors.info}Creating New Location...${colors.reset}`);
    const newLocation = await configService.upsertLocation({
        name: `Test Location ${timestamp}`,
        address: "123 Test St, Test City"
    });
    locationId = newLocation.location_id || newLocation.id; 
    console.log(`${colors.success}✔ Created Location: ${newLocation.name} (ID: ${locationId})${colors.reset}`);

    // Get
    const locations = await configService.getLocations();
    console.log(`${colors.success}✔ Fetched ${locations.length} locations.${colors.reset}`);
  } catch (error: any) {
    console.error(`${colors.error}✖ Location tests failed: ${error.message}${colors.reset}`);
    return; // Critical failure
  }

  if (!locationId) {
      console.error(`${colors.error}✖ No Location ID available. Stopping tests.${colors.reset}`);
      return;
  }

  // 3. Configuration (Age Groups, Terms, Waivers)
  try {
    console.log(`\n${colors.header}--- 3. Configuration ---${colors.reset}`);
    
    // Create Age Group
    console.log(`${colors.info}Creating Age Group...${colors.reset}`);
    const ageGroup = await configService.upsertAgeGroup({
        name: `Test Adult ${timestamp}`,
        min_age: 18,
        max_age: 99
    });
    ageGroupId = ageGroup.age_group_id || ageGroup.id;
    console.log(`${colors.success}✔ Created Age Group: ${ageGroup.name} (ID: ${ageGroupId})${colors.reset}`);

    // Create Subscription Term
    console.log(`${colors.info}Creating Subscription Term...${colors.reset}`);
    const term = await configService.upsertSubscriptionTerm({
        location_id: locationId,
        name: "Test Monthly",
        duration_months: 1,
        payment_mode: "RECURRING" 
    });
    termId = term.subscription_term_id || term.id;
    console.log(`${colors.success}✔ Created Term: ${term.name} (ID: ${termId})${colors.reset}`);

    // Create Waiver
    console.log(`${colors.info}Creating Waiver Program...${colors.reset}`);
    const waiver = await configService.upsertWaiverProgram({
        location_id: locationId,
        name: "Standard Test Waiver",
        description: "Test waiver details...",
        code: `W-${timestamp}`,
        requires_case_manager: false
    });
    waiverId = waiver.waiver_program_id || waiver.id;
    console.log(`${colors.success}✔ Created Waiver: ${waiver.name} (ID: ${waiverId})${colors.reset}`);

  } catch (error: any) {
    console.error(`${colors.error}✖ Config tests failed: ${error.message}${colors.reset}`);
  }

  // 4. Pricing
  try {
    console.log(`\n${colors.header}--- 4. Pricing ---${colors.reset}`);
    if (ageGroupId && termId) {
        console.log(`${colors.info}Creating Base Price...${colors.reset}`);
        await pricingService.createBasePrice({
            location_id: locationId,
            name: "Test Base Price",
            role: "PRIMARY",
            age_group_id: ageGroupId,
            subscription_term_id: termId,
            price: 29.99
        });
        console.log(`${colors.success}✔ Created Base Price${colors.reset}`);
    } else {
        console.warn(`${colors.warn}Skipping Base Price creation (missing dependencies)${colors.reset}`);
    }

    const prices = await pricingService.getBasePrices(locationId);
    console.log(`${colors.success}✔ Base Prices fetched: ${prices.length}${colors.reset}`);
  } catch (error: any) {
    console.error(`${colors.error}✖ Pricing tests failed: ${error.message}${colors.reset}`);
  }

  // 5. Services
  try {
    console.log(`\n${colors.header}--- 5. Services ---${colors.reset}`);
    if (ageGroupId && termId) {
        console.log(`${colors.info}Creating Service...${colors.reset}`);
        const service = await serviceCatalog.upsertService({
            location_id: locationId,
            name: `Test Swim Class ${timestamp}`,
            description: "Beginner class",
            service_type: "class",
            is_addon_only: false,
            pricing_structure: [
                {
                    age_group_id: ageGroupId,
                    terms: [
                        {
                            subscription_term_id: termId,
                            price: 50.00
                        }
                    ]
                }
            ]
        });
        serviceId = service.service_id || service.id;
        console.log(`${colors.success}✔ Created Service: ${service.name} (ID: ${serviceId})${colors.reset}`);
    }

    const services = await serviceCatalog.getServices(locationId);
    console.log(`${colors.success}✔ Services fetched: ${services.length}${colors.reset}`);

    // Update Service (Upsert)
    if (serviceId && ageGroupId && termId) {
        console.log(`${colors.info}Updating Service (Upsert)...${colors.reset}`);
        const updatedService = await serviceCatalog.upsertService({
            service_id: serviceId,
            location_id: locationId,
            name: `Test Swim Class Updated ${timestamp}`,
            description: "Beginner class updated",
            service_type: "class",
            is_addon_only: false,
            pricing_structure: [
                {
                    age_group_id: ageGroupId,
                    terms: [
                        {
                            subscription_term_id: termId,
                            price: 55.00 // Increased price
                        }
                    ]
                }
            ]
        });
        console.log(`${colors.success}✔ Updated Service: ${updatedService.name} (Price Updated)${colors.reset}`);
    }
  } catch (error: any) {
    console.error(`${colors.error}✖ Service tests failed: ${error.message}${colors.reset}`);
  }

  // 6. Memberships
  try {
    console.log(`\n${colors.header}--- 6. Memberships ---${colors.reset}`);
    if (serviceId) {
        console.log(`${colors.info}Creating Membership Program...${colors.reset}`);
        await membershipService.createMembershipProgram({
            location_id: locationId,
            name: `Test Gold Plan ${timestamp}`,
            categories: [
                {
                    name: "Individual",
                    fees: [
                        { fee_type: "JOINING", billing_cycle: "ONE_TIME", amount: 100.00 }
                    ],
                    rules: [
                        { priority: 1, result: "ALLOW", message: "Rule 1", condition_json: { minAdult: 1 } }
                    ],
                    services: [
                        { service_id: serviceId, is_included: true, discount: "20%", usage_limit: "10 visits" }
                    ]
                }
            ]
        });
        console.log(`${colors.success}✔ Created Membership Program${colors.reset}`);
    }
    
    const memberships = await membershipService.getMemberships(locationId);
    const count = Array.isArray(memberships) ? memberships.length : Object.keys(memberships).length;
    console.log(`${colors.success}✔ Memberships fetched: ${count}${colors.reset}`);
  } catch (error: any) {
    console.error(`${colors.error}✖ Membership tests failed: ${error.message}${colors.reset}`);
  }

  // 7. Discounts
  try {
    console.log(`\n${colors.header}--- 7. Discounts ---${colors.reset}`);
    const code = `TEST${timestamp.toString().substring(9)}`;
    console.log(`${colors.info}Creating Discount ${code}...${colors.reset}`);
    
    await discountService.upsertDiscount({
        discount_code: code,
        discount: "10%",
        staff_name: "Test Runner",
        is_active: true
    }, locationId);
    console.log(`${colors.success}✔ Created Discount: ${code}${colors.reset}`);

    const validate = await discountService.validateDiscount(code, locationId);
    if (validate && (validate.valid || validate.success || (validate.data && validate.data.is_active))) {
        console.log(`${colors.success}✔ Discount Validated${colors.reset}`);
    } else {
        console.warn(`${colors.warn}⚠ Discount validation response ambiguous: ${JSON.stringify(validate)}${colors.reset}`);
    }
  } catch (error: any) {
    console.error(`${colors.error}✖ Discount tests failed: ${error.message}${colors.reset}`);
  }

  // 8. CRM Leads
  try {
    console.log(`\n${colors.header}--- 8. CRM Leads ---${colors.reset}`);
    console.log(`${colors.info}Creating Lead...${colors.reset}`);
    await crmService.upsertLead({
        location_id: locationId,
        first_name: "Lead",
        last_name: "Tester",
        email: `lead.${timestamp}@test.com`,
        status: "NEW"
    });
    console.log(`${colors.success}✔ Created Lead${colors.reset}`);

    const leads = await crmService.getLeads(locationId);
    console.log(`${colors.success}✔ Leads fetched: ${leads.length}${colors.reset}`);
  } catch (error: any) {
    console.error(`${colors.error}✖ Leads tests failed: ${error.message}${colors.reset}`);
    if (error.response) console.error("Response:", JSON.stringify(error.response.data));
  }

  // 9. Accounts & Billing
  try {
    console.log(`\n${colors.header}--- 9. Accounts & Billing ---${colors.reset}`);
    
    // Register User (Creates Account)
    console.log(`${colors.info}Registering New User/Account...${colors.reset}`);
    const emailStr = `owner.${timestamp}@test.com`;
    const regData = await authService.registerUser({
        location_id: locationId,
        primary_profile: {
            first_name: "Account",
            last_name: "Owner",
            email: emailStr,
            date_of_birth: "1990-01-01",
            waiver_program_id: waiverId,
            emergency_contact_name: "Emergency Contact",
            emergency_contact_phone: "555-9999"
        },
        family_members: []
    });
    
    accountId = regData.account_id || (regData.data ? regData.data.account_id : undefined);
    
    if (accountId) {
        console.log(`${colors.success}✔ Registered Account: ${accountId}${colors.reset}`);
        
        // Find Profile ID - Use Search by email to avoid 404 from direct detail fetch if missing
        let foundProfile = false;
        
        try {
            const searchRes = await crmService.searchAccounts(emailStr, locationId);
            const accountsFound = searchRes.data || searchRes;
            
            if (Array.isArray(accountsFound) && accountsFound.length > 0) {
                const acc = accountsFound[0];
                if (acc.profiles && acc.profiles.length > 0) {
                    profileId = acc.profiles[0].profile_id;
                    foundProfile = true;
                } else if (acc.primary_profile) {
                    profileId = acc.primary_profile.profile_id || acc.primary_profile.id;
                    foundProfile = true;
                }
            }
        } catch (e) {
            console.warn(`${colors.warn}⚠ Account search failed, falling back to regData info${colors.reset}`);
        }
        
        if (!foundProfile) {
             if (regData.user && regData.user.profile_id) {
                profileId = regData.user.profile_id;
            } else if (regData.primary_profile_id) {
                 profileId = regData.primary_profile_id;
            }
        }

        // Create Subscription
        if (profileId && termId) {
            console.log(`${colors.info}Creating Subscription for Profile ${profileId}...${colors.reset}`);
            
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);

            await billingService.createSubscription({
                account_id: accountId,
                location_id: locationId,
                subscription_type: "BASE",
                reference_id: termId,
                subscription_term_id: termId,
                unit_price_snapshot: 29.99,
                total_amount: 29.99,
                billing_period_start: startDate.toISOString().split('T')[0],
                billing_period_end: endDate.toISOString().split('T')[0],
                coverage: [
                    {
                        profile_id: profileId,
                        role: "PRIMARY",
                        exempt: false
                    }
                ]
            });
            console.log(`${colors.success}✔ Created Subscription${colors.reset}`);
            
            const subs = await billingService.getAccountSubscriptions(accountId);
            console.log(`${colors.success}✔ Account Subscriptions fetched: ${subs.length}${colors.reset}`);
        } else {
             console.warn(`${colors.warn}Skipping Subscription creation (missing profileId or termId). ProfileID: ${profileId}${colors.reset}`);
        }

    } else {
        console.error(`${colors.error}✖ Failed to get Account ID from registration. Response: ${JSON.stringify(regData)}${colors.reset}`);
    }

  } catch (error: any) {
    console.error(`${colors.error}✖ Account/Billing tests failed: ${error.message}${colors.reset}`);
    if (error.response) {
        console.error(`${colors.error}Response Data: ${JSON.stringify(error.response.data)}${colors.reset}`);
    }
  }

  console.log(`\n${colors.header}All Verifications Completed.${colors.reset}`);
}

runTests();
