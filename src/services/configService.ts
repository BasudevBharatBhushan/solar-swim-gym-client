import { apiClient } from './apiClient';
type JsonObject = Record<string, unknown>;

export const configService = {
  // Locations
  getLocations: async () => {
    return apiClient.get('/locations');
  },
  
  upsertLocation: async (locationData: JsonObject) => {
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

  upsertStaff: async (staffData: JsonObject) => {
    // staffData: { staff_id?, first_name, last_name, email, password, role, location_id }
    return apiClient.post('/staff', staffData);
  },

  // Age Groups
  getAgeGroups: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/config/age-groups', {}, options);
  },

  upsertAgeGroup: async (ageGroupData: JsonObject, locationId?: string) => {
    // ageGroupData: { age_group_id?, name, min_age, max_age }
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/config/age-groups', ageGroupData, options);
  },

  // Subscription Terms
  getSubscriptionTerms: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/config/subscription-terms', {}, options);
  },

  upsertSubscriptionTerm: async (termData: JsonObject, locationId?: string) => {
    // termData: { subscription_term_id?, ... }
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/config/subscription-terms', termData, options);
  },

  // Waiver Programs
  getWaiverPrograms: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/config/waiver-programs', {}, options);
  },

  upsertWaiverProgram: async (programData: JsonObject, locationId?: string) => {
    // programData: { waiver_program_id?, name, code, requires_case_manager, is_active }
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/config/waiver-programs', programData, options);
  },

  deleteAgeGroup: async (id: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.delete(`/config/age-groups/${id}`, options);
  },

  deleteSubscriptionTerm: async (id: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.delete(`/config/subscription-terms/${id}`, options);
  },
};
