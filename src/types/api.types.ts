/**
 * API Type Definitions
 * TypeScript types for all API requests and responses
 */

// ============================================================================
// Auth Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  profile: Profile;
}

// ============================================================================
// Profile Types
// ============================================================================

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  date_of_birth: string;
  rceb_flag: boolean;
  account_id: string;
  parent_profile_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileMeResponse {
  profile: Profile;
}

export interface ProfileFamilyResponse {
  profiles: Profile[];
}

// ============================================================================
// Onboarding Types
// ============================================================================

export interface CaseManager {
  name: string;
  email: string;
}

export interface PrimaryProfile {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  mobile: string;
  date_of_birth: string;
  rceb_flag: boolean;
  case_manager?: CaseManager;
  services?: string[]; // Array of service UUIDs
  tenure?: '12mo' | '6mo' | '3mo';
  guardian_name?: string;
  guardian_mobile?: string;
  emergency_mobile?: string;
}

export interface FamilyMember {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  rceb_flag: boolean;
  case_manager?: CaseManager;
  services: string[]; // Array of service UUIDs
  tenure?: '12mo' | '6mo' | '3mo';
  guardian_name?: string;
  guardian_mobile?: string;
  emergency_mobile?: string;
}

export interface OnboardingRequest {
  primary_profile: PrimaryProfile;
  family_members: FamilyMember[];
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  account_id: string;
  primary_profile_id: string;
  family_member_ids: string[];
}

// ============================================================================
// Activation Types
// ============================================================================

export interface ActivationValidateResponse {
  valid: boolean;
  message: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ActivationActivateRequest {
  token: string;
  password: string;
}

export interface ActivationActivateResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Services Types
// ============================================================================

export interface Service {
  id: string; // Mapped from service_id if needed, or we just use service_id
  service_id: string;
  service_name: string;
  service_type?: string;
  eligibility_rules?: any;
  is_active?: boolean;
  name: string; // Keeping for backward compat or mapping
  description?: string;
  category?: string;
  price?: number;
  duration?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServicesListResponse {
  services: Service[];
}

// ============================================================================
// Common API Response Types
// ============================================================================

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export * from './admin.types';
