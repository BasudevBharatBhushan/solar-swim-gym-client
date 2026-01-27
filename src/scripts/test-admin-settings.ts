
// Using built-in fetch

// If node-fetch isn't available, we'll rely on global fetch if running in Node 18+.

const BASE_URL = 'http://localhost:3000/api/v1';

// Credentials - Replace with actual admin credentials if known
const EMAIL = 'mfsi.basudevb@gmail.com'; 
const PASSWORD = '123456';

async function testAdminAPIs() {
    console.log('--- Starting Admin API Tests ---');

    console.log(`[1] Authenticating as ${EMAIL}...`);
    let token = '';
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        
        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        token = loginData.accessToken;
        console.log('Login successful. Token received.');
    } catch (error) {
        console.error('Login error:', error);
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };


    // --- Subscription Types ---
    console.log('\n[2] Testing Subscription Types...');
    let subscriptionTypeId = '';
    try {
        // GET
        const getRes = await fetch(`${BASE_URL}/admin/subscription-types`, { headers });
        console.log('GET /admin/subscription-types status:', getRes.status);
        if (getRes.ok) {
            const data = await getRes.json();
            console.log('Subscription Types (GET):', JSON.stringify(data, null, 2));
        }

        // POST
        const postRes = await fetch(`${BASE_URL}/admin/subscription-types`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type_name: `Test Type ${Date.now()}`,
                billing_interval_unit: "month",
                billing_interval_count: 3,
                auto_renew: true
            })
        });
        console.log('POST /admin/subscription-types status:', postRes.status);
        if (postRes.ok) {
            const data = await postRes.json();
            console.log('Subscription Type (POST):', JSON.stringify(data, null, 2));
            subscriptionTypeId = data.id || data.subscription_type_id; // Capture ID for later use
        } else {
            console.error('Failed to create subscription type:', await postRes.text());
        }
    } catch (e) { console.error(e); }

    // --- Services ---
    console.log('\n[3] Testing Services...');
    let serviceId = '';
    try {
        // GET
        const getRes = await fetch(`${BASE_URL}/admin/services`, { headers });
        console.log('GET /admin/services status:', getRes.status);
        if (getRes.ok) {
            const data = await getRes.json();
             // console.log('Services (GET):', JSON.stringify(data, null, 2));
        }

        // POST
        const postRes = await fetch(`${BASE_URL}/admin/services`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                service_name: `Test Service ${Date.now()}`,
                // description: "Test Description", // Removing parsing error column
                is_active: true
            })
        });
        console.log('POST /admin/services status:', postRes.status);
        if (postRes.ok) {
            const data = await postRes.json();
            console.log('Service (POST):', JSON.stringify(data, null, 2));
             serviceId = data.id || data.service_id;
        } else {
             console.error('Failed to create service:', await postRes.text());
        }
    } catch (e) { console.error(e); }

    // --- Memberships ---
    console.log('\n[4] Testing Memberships...');
    let membershipId = '';
    try {
        const getRes = await fetch(`${BASE_URL}/admin/memberships`, { headers });
        console.log('GET /admin/memberships status:', getRes.status);
        
        const postRes = await fetch(`${BASE_URL}/admin/memberships`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                membership_name: `Test Membership ${Date.now()}`,
                description: "Basic access",
                is_active: true
            })
        });
        console.log('POST /admin/memberships status:', postRes.status);
        if (postRes.ok) {
             const data = await postRes.json();
            console.log('Membership (POST):', JSON.stringify(data, null, 2));
            membershipId = data.id || data.membership_id;
        } else {
            console.error('Failed to create membership:', await postRes.text());
        }
    } catch (e) { console.error(e); }

    // --- Service Plans ---
     console.log('\n[5] Testing Service Plans...');
    try {
        if (serviceId && subscriptionTypeId) {
             // Probe common age groups and user specific terms
             const groupsToTest = [
                'adult', 'child', 'senior', 
                'teen', 'individual', 'individual_plus', 'senior_65', 'add_18', '13_17', '6_12',
                'Adult', 'Child', 'Senior', 'Individual', 'Individual Plus'
             ];
             
             for (const group of groupsToTest) {
                console.log(`Testing age_group: ${group}`);
                const payload = {
                    service_id: serviceId,
                    subscription_type_id: subscriptionTypeId,
                    age_group: group, 
                    funding_type: "private",
                    price: 15.50,
                    currency: "USD"
                };

                const postRes = await fetch(`${BASE_URL}/admin/service-plans`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
                console.log(`POST /admin/service-plans (${group}) status:`, postRes.status);
                if (postRes.ok) {
                    console.log(`SUCCESS: Valid age_group found: ${group}`);
                } else {
                     // console.log(`Failed for ${group}:`, await postRes.text());
                }
             }
        }

    } catch (e) { console.error(e); }

    // --- Membership Plans ---
     console.log('\n[6] Testing Membership Plans...');
    try {
        if (membershipId && subscriptionTypeId) {
            // Trying 'senior' based on guess
            const payload = {
                membership_id: membershipId,
                subscription_type_id: subscriptionTypeId,
                age_group: "senior", 
                funding_type: "private",
                price: 99.99,
                currency: "USD"
            };
            
             const postRes = await fetch(`${BASE_URL}/admin/membership-plans`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            console.log('POST /admin/membership-plans status:', postRes.status);
            if (postRes.ok) {
                const data = await postRes.json();
                console.log('Membership Plan (POST):', JSON.stringify(data, null, 2));
            } else {
                console.error('Failed to create membership plan:', await postRes.text());
            }
        }
    } catch (e) { console.error(e); }


    console.log('\n--- Test Complete ---');
}

testAdminAPIs();

