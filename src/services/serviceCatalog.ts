import { apiClient } from './apiClient';

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
