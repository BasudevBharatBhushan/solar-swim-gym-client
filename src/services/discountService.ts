import { apiClient } from './apiClient';

export interface Discount {
    discount_id: string;
    staff_id?: string;
    location_id: string;
    discount_code: string;
    discount: string; // e.g. "6%" or "50.00"
    staff_name?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export const discountService = {
  getAllDiscounts: async (locationId: string): Promise<Discount[]> => {
    const options = { headers: { 'x-location-id': locationId } };
    const response = await apiClient.get('/discounts', {}, options);
    // Unpack data if wrapped in "data" property
    if (response && response.data && Array.isArray(response.data)) {
        return response.data;
    }
    // Handle case where single object might be returned or different structure
    return Array.isArray(response) ? response : [];
  },

  createDiscount: async (locationId: string, data: Partial<Discount>): Promise<Discount> => {
    const options = { headers: { 'x-location-id': locationId } };
    const response = await apiClient.post('/discounts', data, options);
     if (response && response.data) {
        return response.data;
    }
    return response as Discount;
  },
  
  validateDiscount: async (locationId: string, discountCode: string): Promise<Discount | null> => {
      const options = { headers: { 'x-location-id': locationId } };
      // Assuming a validate endpoint exists or we query by code
      const response = await apiClient.post('/discounts/validate', { discount_code: discountCode }, options);
       if (response && response.data) {
        return response.data;
    }
    return response as Discount;
  }
};
