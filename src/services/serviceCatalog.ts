import { apiClient } from './apiClient';

export interface Service {
  service_id: string;
  location_id?: string;
  name: string;
  description?: string;
  service_type?: string;
  is_addon_only?: boolean;
  pricing_structure?: any[];
}

export const serviceCatalog = {
  // Get all services with pricing structure
  getServices: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/services', {}, options);
  },

  // Create or Update Service and its Pricing
  upsertService: async (serviceData: any) => {
    // serviceData: { service_id?, name, pricing_structure: [...] }
    return apiClient.post('/services', serviceData);
  },
};
