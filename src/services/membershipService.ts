import { apiClient } from './apiClient';

// --- Types ---

export interface MembershipFee {
  membership_fee_id?: string;
  fee_type: 'JOINING' | 'ANNUAL';
  billing_cycle: 'ONE_TIME' | 'YEARLY'; // Assuming these map
  amount: number;
  is_active?: boolean;
}

export interface MembershipRule {
  rule_id?: string;
  priority: number;
  result: 'ALLOW' | 'DENY';
  condition_json: {
    [key: string]: number | undefined;
  }; 
  message?: string;
}

export interface MembershipCategory {
  category_id?: string;
  name: string;
  is_active?: boolean;
  fees: MembershipFee[];
  rules: MembershipRule[];
}

export interface MembershipService {
  membership_service_id?: string;
  service_id?: string; // Parent service ID (enriched)
  service_pack_id: string; // The specific pack being linked
  membership_program_id?: string | null; // Owner ID (Category or Base Price)
  base_price_id?: string | null; 
  location_id?: string; 
  is_included: boolean;
  usage_limit: string;
  discount?: string;
  is_part_of_base_plan?: boolean;
  is_active?: boolean;
  service_name?: string; // Enriched
  service_pack_name?: string; // Enriched
  students_allowed?: number;
  classes?: number;
  waiver_program_id?: string;
  is_shrabable?: boolean;
  max_uses_per_period?: number;
  usage_period_unit?: string;
  usage_period_length?: number;
  enforce_usage_limit?: boolean;
}

export interface MembershipProgram {
  membership_program_id?: string;
  location_id: string;
  name: string;
  services: MembershipService[];
  categories: MembershipCategory[];
  is_active?: boolean;
}


export const membershipService = {
  // Fetch memberships
  getMemberships: async (locationId: string): Promise<MembershipProgram[]> => {
    const options = { headers: { 'x-location-id': locationId } };
    return apiClient.get('/memberships', {}, options);
  },

  // Get Membership Category Details
  getCategory: async (categoryId: string, locationId?: string): Promise<MembershipCategory> => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/memberships/category/${categoryId}`, {}, options);
  },

  // Create or Update Membership Program
  saveMembershipProgram: async (programData: MembershipProgram, locationId?: string): Promise<MembershipProgram> => {
     const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
     return apiClient.post('/memberships', programData, options);
  },

  // Delete Membership Program
  deleteMembershipProgram: async (programId: string, locationId?: string): Promise<void> => {
      const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
      return apiClient.delete(`/memberships/${programId}`, options);
  },

  // Delete Membership Category
  deleteMembershipCategory: async (categoryId: string, locationId?: string): Promise<void> => {
      const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
      return apiClient.delete(`/memberships/category/${categoryId}`, options);
  },

  // --- Unified Service Management ---

  // Fetch Services by Owner (Category OR Base Price)
  getServices: async (ownerId: string, locationId?: string): Promise<MembershipService[]> => {
    // Route: GET /api/membership-services/:ownerId
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/membership-services/${ownerId}`, {}, options);
  },
  
  // Delete Membership Service Link
  deleteServiceLink: async (membershipServiceId: string, locationId?: string): Promise<void> => {
      const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
      return apiClient.delete(`/membership-services/${membershipServiceId}`, options);
  },

  // Upsert Services (Generic)
  // Payload: { service_pack_id, membership_program_id: ownerId, ... }
  upsertServices: async (services: MembershipService[], locationId?: string): Promise<any> => {
    const payload = services.map(s => {
        // We clean up the object to match the expected payload
        const { membership_service_id, service_name, service_pack_name, service_id, ...rest } = s;
        
        // Only include ID if it's truthy (update), else exclude key completely for insert
        const cleanObj: any = { ...rest };
        if (membership_service_id) {
            cleanObj.membership_service_id = membership_service_id;
        }
        
        // Ensure service_pack_id is present
        if (s.service_pack_id) {
            cleanObj.service_pack_id = s.service_pack_id;
        }

        return cleanObj;
    });
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/membership-services/upsert', payload, options);
  },

  // Deprecated: Use getServices(basePlanId) instead
  getBasePlanServices: async (_locationId: string): Promise<MembershipService[]> => {
      console.warn("getBasePlanServices is deprecated. Use getServices(ownerId) instead.");
      return [];
  },

  // Deprecated alias: Use upsertServices
  upsertMembershipServices: async (services: MembershipService[]): Promise<any> => {
      return membershipService.upsertServices(services);
  }
};
