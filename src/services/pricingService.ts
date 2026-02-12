import { apiClient } from './apiClient';
type JsonObject = Record<string, unknown>;

export const pricingService = {
  getBasePrices: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/base-prices', {}, options);
  },

  createBasePrice: async (priceData: JsonObject) => {
    return apiClient.post('/base-prices', priceData);
  },
};
