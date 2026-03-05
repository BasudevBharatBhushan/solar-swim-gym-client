import { apiClient } from './apiClient';

export const crmService = {
  // Leads
  getLeads: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/leads', {}, options);
  },

  searchLeads: async (params: { 
    q?: string, 
    from?: number, 
    size?: number, 
    sort?: string, 
    order?: 'asc' | 'desc', 
    locationId?: string 
  }) => {
    const queryParams: Record<string, string> = {};
    if (params.q) queryParams.q = params.q;
    if (params.from !== undefined) queryParams.from = params.from.toString();
    if (params.size !== undefined) queryParams.size = params.size.toString();
    if (params.sort) queryParams.sort = params.sort;
    if (params.order) queryParams.order = params.order;
    queryParams.elastic = 'false';
    
    const options = params.locationId ? { headers: { 'x-location-id': params.locationId } } : {};
    return apiClient.get('/leads/search', queryParams, options);
  },

  upsertLead: async (leadData: any, locationId?: string) => {
    // leadData: { lead_id?, ... }
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/leads', leadData, options);
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

  searchAccounts: async (params: {
    q?: string,
    from?: number,
    size?: number,
    sort?: string, 
    order?: 'asc' | 'desc',
    locationId?: string
  }) => {
    const queryParams: Record<string, string> = {};
    if (params.q) queryParams.q = params.q;
    if (params.from !== undefined) queryParams.from = params.from.toString();
    if (params.size !== undefined) queryParams.size = params.size.toString();
    if (params.sort) queryParams.sort = params.sort;
    if (params.order) queryParams.order = params.order;
    queryParams.elastic = 'false';

    const options = params.locationId ? { headers: { 'x-location-id': params.locationId } } : {};
    return apiClient.get('/accounts/search', queryParams, options);
  },

  getAccountDetails: async (accountId: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/accounts/${accountId}`, {}, options);
  },

  // Upsert Profiles (Manual modification of Profiles within an existing Account)
  upsertAccountProfiles: async (accountData: any, locationId?: string) => {
    // accountData: { account_id, location_id, primary_profile, family_members }
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/accounts/upsert', accountData, options);
  },

  // Global Indexing
  reindexAll: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/cron/reindex-all', {}, options);
  },

  reindexAccounts: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/accounts/reindex', {}, options);
  },

  importBulkLeads: async (formData: FormData, locationId: string) => {
    return apiClient.upload('/leads/bulk/csv', formData, {
      headers: {
        'x-location-id': locationId
      }
    });
  },

  upsertProfile: async (profileData: any, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/profiles/upsert', profileData, options);
  },

  deleteAccount: async (accountId: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.delete(`/accounts/${accountId}`, options);
  },
};
