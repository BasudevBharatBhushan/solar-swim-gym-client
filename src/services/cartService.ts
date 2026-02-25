import { apiClient } from './apiClient';

export interface CartItemData {
  cart_id?: string;
  account_id: string;
  location_id: string;
  reference_id: string;
  session_id?: string;
  subscription_term_id?: string;
  invoice_id?: string;
  unit_price_snapshot: number;
  total_amount: number;
  actual_total_amount: number;
  subscription_type: string;
  discount_amount?: number;
  discount_percentage?: number;
  discount_code?: string;
  billing_period_start?: string;
  billing_period_end?: string;
  status?: string;
  metadata?: any;
}

export const cartService = {
  /**
   * Fetch all cart entries for the current location.
   */
  getItems: async (locationId: string): Promise<CartItemData[]> => {
    return apiClient.get('/cart', {}, { headers: { 'x-location-id': locationId } });
  },

  /**
   * Fetch data for a specific single cart item.
   */
  getItem: async (id: string): Promise<CartItemData> => {
    return apiClient.get(`/cart/${id}`);
  },

  /**
   * Inserts a new item or updates an existing one if cart_id is provided.
   */
  upsertItem: async (item: CartItemData, locationId?: string): Promise<CartItemData> => {
    const headers: Record<string, string> = {};
    if (locationId) {
      headers['x-location-id'] = locationId;
    }
    return apiClient.post('/cart/upsert', item, { headers });
  },

  /**
   * Deletes one specific entry from the cart using its UUID.
   */
  removeItem: async (id: string): Promise<void> => {
    return apiClient.delete(`/cart/${id}`);
  },

  /**
   * Deletes all cart items belonging to a specific account.
   */
  clearCart: async (accountId: string, locationId?: string): Promise<void> => {
    const headers: Record<string, string> = {};
    if (locationId) {
      headers['x-location-id'] = locationId;
    }
    return apiClient.delete(`/cart/account/${accountId}`, { headers });
  },

  /**
   * Convenience method to convert the frontend CartItem to DB structure
   */
  transformToCartData: (
    item: any, 
    accountId: string, 
    locationId: string
  ): CartItemData => {
    return {
      cart_id: item.cart_id, // if it exists
      account_id: accountId,
      location_id: locationId,
      reference_id: item.referenceId,
      session_id: item.session_id,
      subscription_term_id: item.subscriptionTermId || item.metadata?.subscription_term_id,
      unit_price_snapshot: item.actualPrice || item.price,
      total_amount: item.price,
      actual_total_amount: item.actualPrice || item.price,
      subscription_type: 
        item.type === 'MEMBERSHIP'
          ? item.feeType === 'JOINING'
            ? 'MEMBERSHIP_JOINING'
            : item.feeType === 'ANNUAL'
              ? 'MEMBERSHIP_RENEWAL'
              : 'MEMBERSHIP_FEE'
          : item.type === 'SERVICE'
            ? 'SERVICE'
            : item.type === 'REGISTRATION_FEE'
              ? 'LESSON_REGISTRATION_FEE'
              : 'MEMBERSHIP_FEE', // Default to fee for BASE
      discount_amount: item.discountAmount,
      discount_percentage: item.discountPercentage,
      discount_code: item.discountCode,
      billing_period_start: item.billing_period_start,
      billing_period_end: item.billing_period_end,
      // Metadata can store extra info like coverage/profiles if the backend supports it
      metadata: {
        ...(item.metadata || {}),
        id: item.id,
        coverage: item.coverage,
        name: item.name,
        type: item.type,
        feeType: item.feeType,
        membershipCategoryId: item.membershipCategoryId,
        membershipProgramId: item.membershipProgramId,
        ageGroupId: item.ageGroupId,
        membershipRange: item.membershipRange,
        serviceId: item.serviceId
      }
    };
  }
};
