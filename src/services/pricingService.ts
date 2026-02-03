import { apiClient } from './apiClient';

export const pricingService = {
  getBasePrices: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/base-prices', {}, options);
  },

  createBasePrice: async (priceData: any) => {
    return apiClient.post('/base-prices', priceData);
  },
};
