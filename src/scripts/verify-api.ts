
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api/v1';
const LOGIN_EMAIL = 'priya@kibizsystems.com';
const LOGIN_PASSWORD = '123456';
const LOCATION_ID = '490f7013-a95d-4664-b750-1ecbb98bd463';

async function verify() {
  try {
    console.log('--- Authenticating ---');
    const authResponse = await axios.post(`${BASE_URL}/auth/staff/login`, {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    });
    
    const token = authResponse.data.token;
    console.log('Authentication successful. Token obtained.');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'x-location-id': LOCATION_ID,
    };

    console.log('\n--- 1. Verification: Accounts Search ---');
    const accountsResponse = await axios.get(`${BASE_URL}/accounts/search`, {
      headers,
      params: { size: 1 }
    });
    console.log('Status:', accountsResponse.status);
    console.log('Data:', JSON.stringify(accountsResponse.data, null, 2));
    
    if (!accountsResponse.data.results || accountsResponse.data.results.length === 0) {
        console.warn('No accounts found. Cannot proceed with further verification.');
        return;
    }
    
    const account = accountsResponse.data.results[0];
    const accountId = account.account_id;
    
    console.log('\n--- 2. Verification: Account Details (via search result structure) ---');
    // The requirement says "Use embedded profiles[] from the account search response"
    // So we just inspect what we got.
    if (!account.profiles || !Array.isArray(account.profiles)) {
        console.error('CRITICAL: profiles array missing in account search result!');
    } else {
        console.log('Profiles found in account:', account.profiles.length);
        console.log('First profile:', JSON.stringify(account.profiles[0], null, 2));
    }
    
    if (account.profiles && account.profiles.length > 0) {
        const profileId = account.profiles[0].profile_id;
        console.log('\n--- 3. Verification: Profile Detail Fetch ---');
        try {
            const profileResponse = await axios.get(`${BASE_URL}/profiles/${profileId}`, { headers });
             console.log('Status:', profileResponse.status);
             console.log('Data:', JSON.stringify(profileResponse.data, null, 2));
        } catch (error: any) {
             console.error('Failed to fetch profile details:', error.message);
             if (error.response) console.error(error.response.data);
        }
    }

    console.log('\n--- 4. Verification: Account Subscriptions ---');
    try {
        const subscriptionsResponse = await axios.get(`${BASE_URL}/billing/accounts/${accountId}/subscriptions`, { headers });
        console.log('Status:', subscriptionsResponse.status);
        console.log('Data:', JSON.stringify(subscriptionsResponse.data, null, 2));
    } catch (error: any) {
        console.error('Failed to fetch subscriptions:', error.message);
        if (error.response) console.error(error.response.data);
    }

  } catch (error: any) {
    console.error('Verification Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

verify();
