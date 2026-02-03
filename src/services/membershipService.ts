import { apiClient } from './apiClient';

export const membershipService = {
  // Fetch memberships
  getMemberships: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/memberships', {}, options);
  },

  // Create Membership Program
  createMembershipProgram: async (programData: any) => {
    return apiClient.post('/memberships', programData);
  },
};
