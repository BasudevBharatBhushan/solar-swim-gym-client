
// ============================================================================
// Admin Types
// ============================================================================

export interface SubscriptionType {
  subscription_type_id?: string;  // Primary ID field from API
  id?: string;  // Alias for subscription_type_id (for backward compatibility)
  type_name: string;
  billing_interval_unit: 'month' | 'year' | 'week' | 'day';
  billing_interval_count: number;
  auto_renew: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Membership {
  membership_id: string;
  membership_name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ServicePlan {
  id: string;
  service_id: string;
  subscription_type_id: string;
  age_group: string;
  funding_type: string; // REQUIRED: 'private' or 'rceb'
  price: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface MembershipPlan {
  id: string;
  membership_id: string;
  subscription_type_id: string;
  age_group: string;
  funding_type: string; // REQUIRED: 'private' or 'rceb'
  price: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

// Responses
export interface SubscriptionTypesResponse {
  subscription_types: SubscriptionType[];
}

export interface MembershipsResponse {
  memberships: Membership[];
}

export interface ServicePlansResponse {
  plans: ServicePlan[];
}

export interface MembershipPlansResponse {
  plans: MembershipPlan[];
}

// Search & List Types

export interface PaginatedResponse<T> {
  results: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface AdminProfile {
  id?: string; // For backward compatibility
  profile_id: string; // Primary ID from backend
  account_id: string;
  parent_profile_id: string | null;
  first_name: string;
  last_name: string;
  name?: string; // Computed field: first_name + last_name
  date_of_birth: string;
  email: string | null;
  mobile?: string;
  role: 'HEAD' | 'CHILD' | 'Primary'; // Backend uses HEAD/CHILD, UI might use Primary
  rceb_flag: boolean;
  is_rceb?: boolean; // Alias for rceb_flag
  case_manager_name: string | null;
  case_manager_email: string | null;
  guardian_name: string | null;
  guardian_phoneno: string | null;
  is_active: boolean;
  created_at: string;
  // Optional UI-specific fields
  children?: AdminProfile[];
  plan?: string;
  services?: string[];
  paymentTenure?: string;
  expiryDate?: string;
}

export interface AccountProfile {
  profile_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  parent_profile_id: string | null;
  headmember: boolean;
}

export interface AdminAccount {
  id: string;
  account_id?: string; // Backend returns account_id
  account_name: string; // often Primary Profile Name or "The Smiths"
  email?: string; // Account email
  password_hash?: string;
  primary_profile_id: string;
  primary_profile_name?: string;
  primary_profile_email?: string;
  total_members?: number;
  status: string;
  created_at: string;
  profiles?: AccountProfile[]; // New: array of profiles with details
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  source?: string;
  status: string;
  company?: string;
  notes?: string;
  created_at?: string;
  last_contacted_at?: string;
}

export interface SearchParams {
  q?: string; // Generic search query
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LeadSearchParams extends SearchParams {
  search?: string; // Leads endpoint uses 'search' instead of 'q'?
  status?: string;
  source?: string;
  useElasticsearch?: boolean;
}
