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
  membership_program_id?: string | null;
  location_id?: string; 
  is_included: boolean;
  usage_limit: string; // "Unlimited" or number/text
  discount?: string;
  is_part_of_base_plan: boolean;
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
  // Note: The POST /memberships usually handles creation. If we need update, we might need a specific endpoint or PUT.
  // The context says "Creation & update use POST /api/v1/memberships". So we assume it handles upsert or we send ID.
  saveMembershipProgram: async (programData: MembershipProgram): Promise<MembershipProgram> => {
     return apiClient.post('/memberships', programData);
  },

  // Get Membership Services for Base Plan
  getBasePlanServices: async (locationId: string): Promise<MembershipService[]> => {
    const options = { headers: { 'x-location-id': locationId } };
    const response = await apiClient.get('/membership-services/base-plan', {}, options);
    return response || [];
  },

  // Upsert Membership Services
  upsertMembershipServices: async (services: MembershipService[]): Promise<any> => {
    const payload = services.map(s => {
        const { membership_service_id, service_name, ...rest } = s;
        return {
            ...rest,
            // If it's an update, existing ID should be passed?
            // The user context said: "If membership_service_id is provided -> update; else create."
            // So we DO want to keep it if it exists. 
            membership_service_id: membership_service_id, 
            membership_program_id: s.membership_program_id || null
        };
    });
    return apiClient.post('/membership-services/upsert', payload);
  }
};
