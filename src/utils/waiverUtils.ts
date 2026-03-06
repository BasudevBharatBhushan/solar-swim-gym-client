import { WaiverTemplate } from "../services/waiverService";

/**
 * Interface representing the context needed to resolve a waiver template.
 * This unifies CartItem (Frontend) and Subscription (Backend/Admin) structures.
 */
export interface WaiverResolutionContext {
  type: string; // e.g., 'SERVICE', 'MEMBERSHIP', 'BASE', 'MEMBERSHIP_FEE', 'LESSON_REGISTRATION_FEE', 'REGISTRATION_FEE'
  serviceId?: string | null;
  membershipCategoryId?: string | null;
  subscriptionTermId?: string | null;
  referenceId?: string | null; // For CartItem: base_price_id. For Subscription: base_price_id or membership_category_id
}

/**
 * Resolves the appropriate waiver template(s) for a given context.
 * Useful for automating template selection in Marketplace checkout and Admin tools.
 */
export const resolveWaiverTemplates = (
  templates: WaiverTemplate[],
  context: WaiverResolutionContext
): WaiverTemplate[] => {
  if (!templates || templates.length === 0) return [];

  const typeUpper = context.type.toUpperCase();

  return templates.filter((t) => {
    // 1. Service Logic
    if (typeUpper === "SERVICE") {
      return t.service_id === context.serviceId;
    }

    // 2. Membership Plan Logic
    if (typeUpper === "MEMBERSHIP") {
      const categoryId = context.membershipCategoryId || context.referenceId;
      return t.membership_category_id === categoryId;
    }

    // 3. Membership Fee / Base Price Logic
    if (typeUpper === "BASE" || typeUpper === "MEMBERSHIP_FEE") {
      // Logic from Marketplace:
      // Match by subterm_id OR base_price_id, and template_category = membership
      const isMembershipCategory = t.template_category?.toLowerCase() === "membership";
      const matchesSubterm = isMembershipCategory && context.subscriptionTermId && t.subterm_id === context.subscriptionTermId;
      const matchesBasePrice = t.base_price_id === context.referenceId;
      
      return matchesSubterm || matchesBasePrice;
    }

    // 4. Lesson Registration Fee Logic
    if (typeUpper === "REGISTRATION_FEE" || typeUpper === "LESSON_REGISTRATION_FEE") {
      // Simple fallback based on category text match OR base price
      if (t.base_price_id && context.referenceId && t.base_price_id === context.referenceId) return true;
      return t.template_category?.toLowerCase() === "registration";
    }

    // 5. General Registration Logic
    if (typeUpper === "REGISTRATION") {
      return t.template_category?.toLowerCase() === "registration";
    }

    return false;
  });
};

/**
 * Extract context from a Subscription object
 */
export const getSubscriptionWaiverContext = (subscription: any): WaiverResolutionContext => {
  return {
    type: subscription.subscription_type,
    serviceId: subscription.service_id,
    membershipCategoryId: subscription.subscription_type === 'MEMBERSHIP' ? subscription.reference_id : null,
    subscriptionTermId: subscription.subscription_term_id,
    // referenceId holds base_price_id for fees, service_pack_id for services, membership_category_id for memberships
    referenceId: subscription.reference_id, 
  };
};

/**
 * Extract context from a CartItem
 */
export const getCartItemWaiverContext = (cartItem: any): WaiverResolutionContext => {
  return {
    type: cartItem.type,
    serviceId: cartItem.serviceId,
    membershipCategoryId: cartItem.membershipCategoryId,
    subscriptionTermId: cartItem.subscriptionTermId,
    referenceId: cartItem.referenceId,
  };
};
