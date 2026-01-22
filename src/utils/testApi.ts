/**
 * Test API Utilities
 * Helper functions to test backend API endpoints
 */

import api from '../services/api.service';
import type { OnboardingRequest } from '../types/api.types';

// ============================================================================
// Test Data
// ============================================================================

export const TEST_CREDENTIALS = {
  email: 'john.doe@example.com',
  password: 'securePassword123',
};

export const TEST_ONBOARDING_DATA: OnboardingRequest = {
  primary_profile: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    password: 'securePassword123',
    mobile: '555-0123',
    date_of_birth: '1985-05-15',
    rceb_flag: true,
    case_manager: {
      name: 'Jane Smith',
      email: 'jane.smith@rceb.org',
    },
  },
  family_members: [
    {
      first_name: 'Child',
      last_name: 'One',
      date_of_birth: '2018-02-10',
      email: 'child1@example.com',
      rceb_flag: false,
      services: ['5cd7c77b-9066-47a6-9bc9-cfbac0998fee'],
    },
    {
      first_name: 'Child',
      last_name: 'Two',
      date_of_birth: '2015-06-22',
      email: 'child2@example.com',
      rceb_flag: true,
      services: [
        '5cd7c77b-9066-47a6-9bc9-cfbac0998fee',
        '95093809-9012-4a5f-9452-e125708db12e',
      ],
    },
  ],
};

// ============================================================================
// Test Functions
// ============================================================================

/**
 * Test login endpoint
 */
export async function testLogin() {
  console.log('🧪 Testing login...');
  try {
    const response = await api.auth.login(TEST_CREDENTIALS);
    console.log('✅ Login successful!');
    console.log('Access Token:', response.accessToken);
    console.log('Profile:', response.profile);
    return response;
  } catch (error) {
    console.error('❌ Login failed:', error);
    throw error;
  }
}

/**
 * Test onboarding endpoint
 */
export async function testOnboarding() {
  console.log('🧪 Testing onboarding...');
  try {
    const response = await api.onboarding.complete(TEST_ONBOARDING_DATA);
    console.log('✅ Onboarding successful!');
    console.log('Account ID:', response.account_id);
    console.log('Primary Profile ID:', response.primary_profile_id);
    console.log('Family Member IDs:', response.family_member_ids);
    return response;
  } catch (error) {
    console.error('❌ Onboarding failed:', error);
    throw error;
  }
}

/**
 * Test activation validation endpoint
 */
export async function testActivationValidate(token: string) {
  console.log('🧪 Testing activation validation...');
  try {
    const response = await api.activation.validate(token);
    console.log('✅ Validation successful!');
    console.log('Valid:', response.valid);
    console.log('Message:', response.message);
    if (response.profile) {
      console.log('Profile:', response.profile);
    }
    return response;
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

/**
 * Test activation endpoint
 */
export async function testActivation(token: string, password: string) {
  console.log('🧪 Testing activation...');
  try {
    const response = await api.activation.activate({ token, password });
    console.log('✅ Activation successful!');
    console.log('Success:', response.success);
    console.log('Message:', response.message);
    return response;
  } catch (error) {
    console.error('❌ Activation failed:', error);
    throw error;
  }
}

/**
 * Test get current profile endpoint
 */
export async function testGetProfile() {
  console.log('🧪 Testing get profile...');
  try {
    const response = await api.profile.getMe();
    console.log('✅ Get profile successful!');
    console.log('Profile:', response.profile);
    return response;
  } catch (error) {
    console.error('❌ Get profile failed:', error);
    throw error;
  }
}

/**
 * Test get family members endpoint
 */
export async function testGetFamily() {
  console.log('🧪 Testing get family...');
  try {
    const response = await api.profile.getFamily();
    console.log('✅ Get family successful!');
    console.log('Family Members:', response.profiles);
    return response;
  } catch (error) {
    console.error('❌ Get family failed:', error);
    throw error;
  }
}

/**
 * Test get services endpoint
 */
export async function testGetServices() {
  console.log('🧪 Testing get services...');
  try {
    const response = await api.services.list();
    console.log('✅ Get services successful!');
    console.log('Services:', response.services);
    return response;
  } catch (error) {
    console.error('❌ Get services failed:', error);
    throw error;
  }
}

/**
 * Test logout
 */
export function testLogout() {
  console.log('🧪 Testing logout...');
  api.auth.logout();
  console.log('✅ Logout successful! Token removed from localStorage.');
}

// ============================================================================
// Full Flow Tests
// ============================================================================

/**
 * Test complete onboarding flow
 */
export async function testOnboardingFlow() {
  console.log('🧪 Testing complete onboarding flow...');
  console.log('');

  try {
    // Step 1: Complete onboarding
    console.log('Step 1: Complete onboarding');
    await testOnboarding();
    console.log('');

    // Step 2: Login as primary parent
    console.log('Step 2: Login as primary parent');
    await testLogin();
    console.log('');

    // Step 3: Get current profile
    console.log('Step 3: Get current profile');
    await testGetProfile();
    console.log('');

    // Step 4: Get family members
    console.log('Step 4: Get family members');
    await testGetFamily();
    console.log('');

    // Step 5: Get services
    console.log('Step 5: Get services');
    await testGetServices();
    console.log('');

    console.log('✅ Complete onboarding flow successful!');
  } catch (error) {
    console.error('❌ Onboarding flow failed:', error);
    throw error;
  }
}

/**
 * Test complete activation flow
 * Note: You need a valid activation token from email
 */
export async function testActivationFlow(token: string, password: string) {
  console.log('🧪 Testing complete activation flow...');
  console.log('');

  try {
    // Step 1: Validate token
    console.log('Step 1: Validate activation token');
    await testActivationValidate(token);
    console.log('');

    // Step 2: Activate profile
    console.log('Step 2: Activate profile');
    await testActivation(token, password);
    console.log('');

    // Step 3: Login with new credentials
    console.log('Step 3: Login with activated profile');
    // You'll need to use the email from the token validation
    console.log('');

    console.log('✅ Complete activation flow successful!');
  } catch (error) {
    console.error('❌ Activation flow failed:', error);
    throw error;
  }
}

// ============================================================================
// Export for browser console usage
// ============================================================================

// Make test functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).apiTests = {
    testLogin,
    testOnboarding,
    testActivationValidate,
    testActivation,
    testGetProfile,
    testGetFamily,
    testGetServices,
    testLogout,
    testOnboardingFlow,
    testActivationFlow,
  };

  console.log('✅ API test functions loaded!');
  console.log('Available tests:');
  console.log('  - apiTests.testLogin()');
  console.log('  - apiTests.testOnboarding()');
  console.log('  - apiTests.testActivationValidate(token)');
  console.log('  - apiTests.testActivation(token, password)');
  console.log('  - apiTests.testGetProfile()');
  console.log('  - apiTests.testGetFamily()');
  console.log('  - apiTests.testGetServices()');
  console.log('  - apiTests.testLogout()');
  console.log('  - apiTests.testOnboardingFlow()');
  console.log('  - apiTests.testActivationFlow(token, password)');
}
