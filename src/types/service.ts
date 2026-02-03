export interface PricingTerm {
  subscription_term_id: string;
  term_name: string;
  price: number;
  price_id?: string;
}

export interface AgeGroupPricing {
  age_group_id: string;
  age_group_name: string;
  terms: PricingTerm[];
}

export type ServiceType = 'PRIVATE' | 'GROUP';
export type ServiceMethod = 'SELF' | 'TRAINING' | 'WORKSHOP';

export interface Service {
  service_id: string;
  location_id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_addon_only?: boolean;
  type: ServiceType;
  service_type: ServiceMethod;
  pricing_structure: AgeGroupPricing[];
}
