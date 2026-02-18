import { apiClient } from './apiClient';

export interface Discount {
    discount_id: string;
    staff_id?: string;
    location_id: string;
    service_id?: string | null;
    discount_code: string;
    discount: string; // e.g. "6%" or "50.00"
    staff_name?: string;
    is_active: boolean;
    start_date?: string | null;
    end_date?: string | null;
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
    // Handle case where array is returned directly
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
  
  upsertDiscount: async (data: Partial<Discount>, locationId: string): Promise<Discount> => {
    const options = { headers: { 'x-location-id': locationId } };
    // Assuming backend handles upsert on /discounts POST or there is a specific endpoint
    // Following the pattern of createDiscount but with name expected by tests
    const response = await apiClient.post('/discounts', data, options);
    if (response && response.data) {
        return response.data;
    }
    return response as Discount;
  },

  validateDiscount: async (discountCode: string, locationId: string): Promise<Discount | null> => {
    const options = { headers: { 'x-location-id': locationId } };
    try {
      // As per Postman collection: GET /discounts/validate/:code
      const response = await apiClient.get(`/discounts/validate/${discountCode}`, {}, options);
      if (!response) return null;
      // Handle wrapped or direct response
      const data: Discount = response.data ?? response;
      return data;
    } catch {
      return null;
    }
  }
};
