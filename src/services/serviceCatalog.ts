import { apiClient } from './apiClient';

export interface Service {
  service_id: string;
  location_id?: string;
  name: string;
  description?: string;
  type?: string;
  service_type?: string;
  is_active?: boolean;
  is_addon_only?: boolean;
}

export interface ServicePack {
  service_pack_id?: string;
  service_id: string;
  name: string;
  description?: string;
  classes?: number;
  duration_days?: number;
  duration_months?: number;
}

export interface ServicePrice {
    service_price_id?: string;
    service_pack_id: string;
    age_group_id: string;
    subscription_term_id?: string; // Optional if not recurring
    price: number;
}

export interface Session {
    session_id?: string;
    name: string;
    start_date: string;
    expiry_date: string;
}

export const serviceCatalog = {
  // Get all services (Metadata only now)
  getServices: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/services', {}, options);
  },

  // Create or Update Service (Metadata)
  upsertService: async (serviceData: any) => {
    return apiClient.post('/services', serviceData);
  },

  uploadServiceImage: async (serviceId: string, locationId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.upload(`/services/${serviceId}/image`, formData, {
        headers: { 'x-location-id': locationId }
    });
  },

  // --- Packs ---
  getServicePacks: async (serviceId: string) => {
      return apiClient.get(`/services/${serviceId}/service-packs`);
  },

  upsertServicePack: async (packData: any) => {
      // packData should include service_id
      return apiClient.post('/service-packs/upsert', packData);
  },

  // --- Prices ---
  getPackPrices: async (servicePackId: string) => {
      return apiClient.get(`/service-packs/${servicePackId}/prices`);
  },

  upsertServicePrice: async (priceData: any) => {
      return apiClient.post('/service-packs/prices/upsert', priceData);
  },

  // --- Sessions ---
  getSessions: async () => {
      return apiClient.get('/sessions');
  },

  upsertSession: async (sessionData: any) => {
      return apiClient.post('/sessions/upsert', sessionData);
  }
};
