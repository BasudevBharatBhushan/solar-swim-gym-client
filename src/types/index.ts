
export interface Profile {
  profile_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  date_of_birth?: string;
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
  coverage: {
      profile_id: string;
      role: 'PRIMARY' | 'ADD_ON'; 
  }[];
  // We might need a computed field for display name if reference_id isn't enough
  // For now, let's assume we can fetch or it comes with some expanded data, 
  // or we just display reference_id until we have a lookup
  plan_name?: string; // Optional if backend returns it or we map it
}

export interface AccountSearchResponse {
  total: number;
  results: Account[];
}
