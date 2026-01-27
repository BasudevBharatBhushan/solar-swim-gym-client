
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
