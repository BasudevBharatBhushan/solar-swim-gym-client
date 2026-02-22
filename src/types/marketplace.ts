import { ServicePack, ServicePrice } from '../services/serviceCatalog';

export interface CoverageProfile {
    profile_id: string;
    name: string;
    age_group?: string;
    date_of_birth?: string | null;
    role?: 'PRIMARY' | 'ADD_ON';
}

export interface AccountProfile {
    profile_id: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string | null;
    waiver_program?: {
        code: string;
        name: string;
    };
    is_primary?: boolean;
}

export interface RuleRange {
    [ageGroupId: string]: { min: number; max: number };
}

export interface CartItem {
    id: string;
    cart_id?: string;
    type: 'BASE' | 'MEMBERSHIP' | 'SERVICE';
    referenceId: string;
    name: string;
    /** The final (possibly discounted) price used for checkout */
    price: number;
    /** Original price before any discount */
    actualPrice?: number;
    /** Flat dollar amount discounted */
    discountAmount?: number;
    /** Percentage discounted (informational) */
    discountPercentage?: number;
    /** Discount code applied (if any) */
    discountCode?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    coverage?: CoverageProfile[];
    feeType?: 'JOINING' | 'ANNUAL' | '';
    membershipCategoryId?: string;
    membershipProgramId?: string;
    subscriptionTermId?: string;
    /** The service_id this item is linked to (for discount applicability check) */
    serviceId?: string;
    /** Age group validation for BASE plans */
    ageGroupId?: string;
    /** Household rule validation for MEMBERSHIP plans */
    membershipRange?: RuleRange;
    
    // New fields for enhancements
    session_id?: string;
    billing_period_start?: string;
    billing_period_end?: string;
}

export interface ServicePackSelection {
    service: {
        service_id: string;
        name: string;
    };
    pack: ServicePack & {
        prices?: ServicePrice[];
    };
}
