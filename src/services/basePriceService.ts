import { apiClient } from './apiClient';

export interface BasePrice {
  base_price_id?: string;
  location_id: string;
  name: string; // Plan Name e.g. "Individual", "Gold"
  role: 'PRIMARY' | 'ADD_ON';
  age_group_id: string;
  subscription_term_id: string;
  price: number;
  discount?: string; // "10" or "10%"
  is_active: boolean;
  
  // Resolved names
  age_group_name?: string;
  term_name?: string;
}

export interface BasePlanResponse {
    prices: BasePrice[];
}

export const basePriceService = {
  // Get all base prices
  getAll: async (locationId: string): Promise<BasePlanResponse> => {
    const options = { headers: { 'x-location-id': locationId } };
    const response = await apiClient.get('/base-prices', {}, options);
    return {
        prices: response.prices || []
    };
  },

  // Create or Update Base Price
    // Supports both single object (legacy/create) and bulk object { prices: [] }
    upsert: async (data: BasePrice | { location_id: string; prices: BasePrice[] }, locationId?: string): Promise<BasePrice | BasePrice[]> => {
        const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
        const response = await apiClient.post('/base-prices', data, options);
        // If bulk, it likely returns { prices: [...] } or just the array
        if ('prices' in data && Array.isArray(data.prices)) {
             return response.prices || response;
        }
        return response.prices ? response.prices[0] : response;
    },
};
