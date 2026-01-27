/**
 * Comprehensive Admin Settings API Test
 * 
 * This script tests all admin settings APIs to understand:
 * 1. Correct age_group values accepted by the backend
 * 2. Response formats
 * 3. Required fields in payloads
 * 
 * Run with: npx tsx src/scripts/test-admin-api-comprehensive.ts
 */

const BASE_URL = 'http://localhost:3000/api/v1';

// No authentication required for admin APIs (for now)

interface TestResult {
    endpoint: string;
    method: string;
    status: number;
    success: boolean;
    data?: any;
    error?: string;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
    results.push(result);
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.method} ${result.endpoint} - Status: ${result.status}`);
    if (result.error) {
        console.log(`   Error: ${result.error}`);
    }
}

async function testEndpoint(
    endpoint: string,
    method: string,
    body?: any
): Promise<TestResult> {
    try {
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const contentType = response.headers.get('content-type');
        
        let data;
        if (contentType?.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        const result: TestResult = {
            endpoint,
            method,
            status: response.status,
            success: response.ok,
            data: response.ok ? data : undefined,
            error: !response.ok ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined
        };

        return result;
    } catch (error: any) {
        return {
            endpoint,
            method,
            status: 0,
            success: false,
            error: error.message
        };
    }
}

async function main() {
    console.log('='.repeat(80));
    console.log('ADMIN SETTINGS API COMPREHENSIVE TEST');
    console.log('No authentication required for admin APIs');
    console.log('='.repeat(80));
    console.log();

    // Step 2: Test Subscription Types
    console.log('[1] Testing Subscription Types...');
    const subTypesGet = await testEndpoint('/admin/subscription-types', 'GET');
    logResult(subTypesGet);
    
    if (subTypesGet.success) {
        console.log('   Sample data:', JSON.stringify(subTypesGet.data, null, 2).substring(0, 200));
    }

    const subTypeCreate = await testEndpoint('/admin/subscription-types', 'POST', {
        type_name: `Test ${Date.now()}`,
        billing_interval_unit: 'month',
        billing_interval_count: 1,
        auto_renew: true
    });
    logResult(subTypeCreate);
    const subscriptionTypeId = subTypeCreate.data?.id || subTypeCreate.data?.subscription_type_id;

    console.log();

    // Step 3: Test Services
    console.log('[2] Testing Services...');
    const servicesGet = await testEndpoint('/admin/services', 'GET');
    logResult(servicesGet);

    const serviceCreate = await testEndpoint('/admin/services', 'POST', {
        service_name: `Test Service ${Date.now()}`,
        is_active: true
    });
    logResult(serviceCreate);
    const serviceId = serviceCreate.data?.id || serviceCreate.data?.service_id;

    console.log();

    // Step 4: Test Memberships
    console.log('[3] Testing Memberships...');
    const membershipsGet = await testEndpoint('/admin/memberships', 'GET');
    logResult(membershipsGet);

    const membershipCreate = await testEndpoint('/admin/memberships', 'POST', {
        membership_name: `Test Membership ${Date.now()}`,
        description: 'Test description',
        is_active: true
    });
    logResult(membershipCreate);
    const membershipId = membershipCreate.data?.id || membershipCreate.data?.membership_id;

    console.log();

    // Step 5: Test Service Plans with different age_group values
    console.log('[4] Testing Service Plans with various age_group values...');
    
    if (serviceId && subscriptionTypeId) {
        const ageGroupsToTest = [
            // Exact values from new schema
            'Individual',
            'Individual Plus',
            'Senior (65+)',
            'Adult (18+)',
            'Teen (13–17)',
            'Child (6–12)',
            'Infant (0–5)'
        ];

        for (const ageGroup of ageGroupsToTest) {
            console.log(`\n   Testing age_group: "${ageGroup}"`);
            const result = await testEndpoint('/admin/service-plans', 'POST', {
                service_id: serviceId,
                subscription_type_id: subscriptionTypeId,
                age_group: ageGroup,
                funding_type: 'private',  // Required field
                price: 10.00,
                currency: 'USD'
            });
            
            const icon = result.success ? '✅' : '❌';
            console.log(`   ${icon} Status: ${result.status}`);
            
            if (result.success) {
                console.log(`      ✨ VALID age_group: "${ageGroup}"`);
                console.log(`      Response:`, JSON.stringify(result.data, null, 2));
                // Don't break - test all age groups
            } else if (result.error) {
                console.log(`      Error: ${result.error.substring(0, 100)}`);
            }
        }
    } else {
        console.log('   ⚠️  Skipped: Missing serviceId or subscriptionTypeId');
    }

    console.log();

    // Step 6: Test Membership Plans
    console.log('[5] Testing Membership Plans...');
    
    if (membershipId && subscriptionTypeId) {
        const result = await testEndpoint('/admin/membership-plans', 'POST', {
            membership_id: membershipId,
            subscription_type_id: subscriptionTypeId,
            age_group: 'Individual', // Using the new schema value
            funding_type: 'private',  // Required field
            price: 100.00,
            currency: 'USD'
        });
        logResult(result);
        
        if (result.success) {
            console.log('   Response:', JSON.stringify(result.data, null, 2));
        }
    } else {
        console.log('   ⚠️  Skipped: Missing membershipId or subscriptionTypeId');
    }

    console.log();

    // Summary
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log();

    if (failCount > 0) {
        console.log('Failed Tests:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.method} ${r.endpoint}: ${r.error}`);
        });
    }
}

main().catch(console.error);
