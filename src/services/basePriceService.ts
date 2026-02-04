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
    const response = await apiClient.get(`/base-prices?location_id=${locationId}`);
    return {
        prices: response.prices || []
    };
  },

  // Create or Update Base Price
  upsert: async (data: BasePrice): Promise<BasePrice> => {
    const response = await apiClient.post('/base-prices', data);
    return response.prices ? response.prices[0] : response;
  },
};
