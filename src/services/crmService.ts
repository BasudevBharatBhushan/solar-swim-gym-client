import { apiClient } from './apiClient';

export const crmService = {
  // Leads
  getLeads: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/leads', {}, options);
  },

  searchLeads: async (query: string, status?: string, locationId?: string) => {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (status) params.status = status;
    
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/leads/search', params, options);
  },

  upsertLead: async (leadData: any) => {
    // leadData: { lead_id?, ... }
    return apiClient.post('/leads', leadData);
  },

  reindexLeads: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/leads/reindex', {}, options);
  },

  // Accounts & Profiles
  getAccounts: async (page = 1, limit = 50, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/accounts', { page, limit }, options);
  },

  searchAccounts: async (query: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/accounts/search', { q: query }, options);
  },

  getAccountDetails: async (accountId: string) => {
    return apiClient.get(`/accounts/${accountId}`);
  },

  // Upsert Profiles (Manual modification of Profiles within an existing Account)
  upsertAccountProfiles: async (accountData: any) => {
    // accountData: { account_id, location_id, primary_profile, family_members }
    return apiClient.post('/accounts/upsert', accountData);
  },

  // Global Indexing
  reindexAll: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/cron/reindex-all', {}, options);
  },
};
