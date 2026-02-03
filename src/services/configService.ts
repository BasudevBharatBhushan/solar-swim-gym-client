import { apiClient } from './apiClient';

export const configService = {
  // Locations
  getLocations: async () => {
    return apiClient.get('/locations');
  },
  
  upsertLocation: async (locationData: any) => {
    // locationData: { id?, name, address }
    return apiClient.post('/locations', locationData);
  },

  // Staff Management
  getStaff: async (locationId?: string) => {
    // Usually filtered by location_id from session, but docs say "Filter: By location_id (from session)"
    // However, the GET might return all staff for that location.
    // If param is needed, we can pass it, but docs imply session context.
    return apiClient.get('/staff', locationId ? { location_id: locationId } : {});
  },

  upsertStaff: async (staffData: any) => {
    // staffData: { staff_id?, first_name, last_name, email, password, role, location_id }
    return apiClient.post('/staff', staffData);
  },

  // Age Groups
  getAgeGroups: async () => {
    return apiClient.get('/config/age-groups');
  },

  upsertAgeGroup: async (ageGroupData: any) => {
    // ageGroupData: { age_group_id?, name, min_age, max_age }
    return apiClient.post('/config/age-groups', ageGroupData);
  },

  // Subscription Terms
  getSubscriptionTerms: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/config/subscription-terms', {}, options);
  },

  upsertSubscriptionTerm: async (termData: any) => {
    // termData: { subscription_term_id?, ... }
    return apiClient.post('/config/subscription-terms', termData);
  },

  // Waiver Programs
  getWaiverPrograms: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/config/waiver-programs', {}, options);
  },

  upsertWaiverProgram: async (programData: any) => {
    // programData: { waiver_program_id?, name, code, requires_case_manager, is_active }
    return apiClient.post('/config/waiver-programs', programData);
  },
};
