export interface OnboardingProfileData {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  date_of_birth: string | null;
  family_count: number;
  waiver_program_id?: string | null;
  case_manager_name?: string;
  case_manager_email?: string;
  guardian_name?: string;
}

export interface OnboardingFamilyMember {
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  email?: string;
  waiver_program_id?: string | null;
  case_manager_name?: string;
  case_manager_email?: string;
  guardian_name?: string;
  guardian_mobile?: string;
  emergency_phone?: string;
}

export type OnboardingErrors = Partial<Record<string, string>>;
