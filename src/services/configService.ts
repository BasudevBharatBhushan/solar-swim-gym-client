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
  getAgeGroups: async (locationId?: string, category?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    let url = '/config/age-groups';
    if (category) {
        url = `/config/age-groups/category/${category}`;
    }
    return apiClient.get(url, locationId ? { location_id: locationId } : {}, options);
  },

  upsertAgeGroup: async (ageGroupData: any, locationId?: string) => {
    // ageGroupData: { age_group_id?, name, min_age, max_age, age_group_category }
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/config/age-groups', ageGroupData, options);
  },

  // Subscription Terms
  getSubscriptionTerms: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/config/subscription-terms', {}, options);
  },

  upsertSubscriptionTerm: async (termData: any, locationId?: string) => {
    // termData: { subscription_term_id?, ... }
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/config/subscription-terms', termData, options);
  },

  // Waiver Programs
  getWaiverPrograms: async () => {
    return apiClient.get('/config/waiver-programs');
  },

  upsertWaiverProgram: async (programData: any, locationId?: string) => {
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
  deleteWaiverProgram: async (id: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.delete(`/config/waiver-programs/${id}`, options);
  },
};
