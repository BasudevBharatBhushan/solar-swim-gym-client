
export interface Profile {
  profile_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone?: string;
  mobile?: string;
  date_of_birth?: string;
  waiver_program_id?: string;
  waiver_program?: {
      code: string;
      name: string;
  };
  is_primary?: boolean;
  relationship?: string;
  gender?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  guardian_name?: string;
  guardian_mobile?: string;
  guardian_email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  case_manager_name?: string;
  case_manager_email?: string;
}

export interface Account {
  account_id: string;
  location_id: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  profiles: Profile[];
  heard_about_us?: string;
  notify_primary_member?: boolean;
  notify_guardian?: boolean;
}

export interface Subscription {
  subscription_id: string;
  subscription_type: 'MEMBERSHIP_FEE' | 'MEMBERSHIP_JOINING' | 'MEMBERSHIP_RENEWAL' | 'SERVICE';
  reference_id: string; // ID of the plan/service
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'PENDING_PAYMENT' | 'CANCELLED';
  created_at: string;
  billing_period_start?: string;
  billing_period_end?: string;
  coverage?: {
      profile_id: string;
      role: 'PRIMARY' | 'ADD_ON';
      profile?: any;
  }[];
  subscription_coverage?: {
      profile_id: string;
      role: 'PRIMARY' | 'ADD_ON';
      profile?: any;
  }[];
  plan_name?: string; 
  invoice?: {
    invoice_id: string;
    status: string;
    total_amount: number;
    AmountDue?: number;
    created_at: string;
    payment_transactions?: any[];
  };
}

export interface Session {
  session_id?: string;
  name: string;
  start_date: string;
  end_date: string;
  duration_unit?: 'MONTH' | 'DAY' | 'WEEK';
  duration?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AccountSearchResponse {
  total: number;
  results: Account[];
}

export interface WaiverTemplate {
  waiver_template_id: string;
  location_id: string;
  ageprofile_id: string | null;
  service_id?: string | null;
  membership_category_id?: string | null;
  content: string;
  is_active: boolean;
  is_before_payment?: boolean;
  is_after_payment_info_captured?: boolean;
  is_after_payment?: boolean;
}

export interface GroupedWaiverTemplate {
  template_name: string;
  template_category: string;
  content: string;
  is_before_payment?: boolean;
  is_after_payment_info_captured?: boolean;
  is_after_payment?: boolean;
  assignments: {
    service_ids: string[];
    membership_category_ids: string[];
    base_price_ids: string[];
    ageprofile_ids: string[];
    subterm_ids: string[];
  };
}

export interface PaymentLinkResponse {
  message: string;
  token: string;
  expires_at: string;
  id: string;
}

export interface PaymentLinkDetails {
  id: string;
  token: string;
  invoice_id: string;
  account_id: string;
  location_id: string;
  amount_to_be_paid: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  expires_at: string;
  invoice_no: string;
  location_name: string;
  profile_name: string;
  saved_methods: {
    id: string;
    brand: string;
    last4: string;
    expiry: string;
  }[];
}

export interface PaymentLinkPayResponse {
  message: string;
  transaction: {
    id: string;
    status: string;
    amount: number;
    approval_code: string;
  };
}
