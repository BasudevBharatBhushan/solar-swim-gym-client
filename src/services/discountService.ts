import { apiClient } from './apiClient';

export const discountService = {
  getDiscounts: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/discounts', {}, options);
  },

  upsertDiscount: async (discountData: any, locationId?: string) => {
    // discountData: { discount_id?, discount_code, discount, staff_name, is_active }
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/discounts', discountData, options);
  },

  validateDiscount: async (code: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/discounts/validate/${code}`, {}, options);
  },
};
