
export interface Profile {
  profile_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  date_of_birth?: string;
  is_primary?: boolean;
  guardian_name?: string;
  guardian_mobile?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  waiver_program?: {
      code: string;
      name: string;
  };
}

export interface Account {
  account_id: string;
  location_id: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  profiles: Profile[];
}

export interface Subscription {
  subscription_id: string;
  subscription_type: 'BASE' | 'MEMBERSHIP_FEE' | 'ADDON_SERVICE';
  reference_id: string; // ID of the plan/service
  status: 'ACTIVE' | 'PAID' | 'CANCELLED';
  created_at: string;
  billing_period_start?: string;
  billing_period_end?: string;
  coverage?: {
      profile_id: string;
      role: 'PRIMARY' | 'ADD_ON';
      profile?: Profile;
  }[];
  subscription_coverage?: {
      profile_id: string;
      role: 'PRIMARY' | 'ADD_ON';
      profile?: Profile;
  }[];
  plan_name?: string; 
}

export interface AccountSearchResponse {
  total: number;
  results: Account[];
}
