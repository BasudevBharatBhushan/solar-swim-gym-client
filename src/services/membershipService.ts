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
    minChild?: number;
    maxChild?: number;
    minAdult?: number;
    maxAdult?: number;
    minSenior?: number;
    maxSenior?: number;
    [key: string]: any;
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
  service_id: string;
  membership_program_id?: string | null; // Used as the generic owner ID in payload
  base_price_id?: string | null; // Returned from backend if attached to Base Price
  location_id?: string; 
  is_included: boolean;
  usage_limit: string; // "Unlimited" or number/text
  discount?: string;
  is_part_of_base_plan?: boolean; // May be deprecated in favor of base_price_id check
  is_active?: boolean;
  service_name?: string; // From join
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

  // Create or Update Membership Program
  saveMembershipProgram: async (programData: MembershipProgram, locationId?: string): Promise<MembershipProgram> => {
     const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
     return apiClient.post('/memberships', programData, options);
  },

  // --- Unified Service Management ---

  // Fetch Services by Owner (Category OR Base Price)
  getServices: async (ownerId: string, locationId?: string): Promise<MembershipService[]> => {
    // Route: GET /api/membership-services/:ownerId
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/membership-services/${ownerId}`, {}, options);
  },

  // Upsert Services (Generic)
  // Payload: { service_id, membership_program_id: ownerId, ... }
  // The backend maps 'membership_program_id' to the correct column based on the ownerId type.
  upsertServices: async (services: MembershipService[], locationId?: string): Promise<any> => {
    const payload = services.map(s => {
        // We clean up the object to match the expected payload
        const { membership_service_id, service_name, ...rest } = s;
        
        // Only include ID if it's truthy (update), else exclude key completely for insert
        const cleanObj: any = { ...rest };
        if (membership_service_id) {
            cleanObj.membership_service_id = membership_service_id;
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
