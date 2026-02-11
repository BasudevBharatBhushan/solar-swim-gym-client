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
  image_url?: string;
  LessonRegistrationFee?: number;
  packs?: ServicePack[];
}

export interface ServicePack {
  service_pack_id?: string;
  service_id: string;
  name: string;
  description?: string;
  classes?: number;
  duration_days?: number;
  duration_months?: number;
  is_waiver_free_allowed?: boolean;
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
  upsertService: async (serviceData: any, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/services', serviceData, options);
  },

  uploadServiceImage: async (serviceId: string, locationId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.upload(`/services/${serviceId}/image`, formData, {
        headers: { 'x-location-id': locationId }
    });
  },

  // --- Packs ---
  getServicePacks: async (serviceId: string, locationId?: string) => {
      const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
      return apiClient.get(`/services/${serviceId}/service-packs`, {}, options);
  },

  upsertServicePack: async (packData: any, locationId?: string) => {
      // packData should include service_id
      const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
      return apiClient.post('/service-packs/upsert', packData, options);
  },

  // --- Prices ---
  getPackPrices: async (servicePackId: string, locationId?: string) => {
      const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
      return apiClient.get(`/service-packs/${servicePackId}/prices`, {}, options);
  },

  upsertServicePrice: async (priceData: any, locationId?: string) => {
      const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
      return apiClient.post('/service-packs/prices/upsert', priceData, options);
  },

  // --- Sessions ---
  getSessions: async (locationId?: string) => {
      const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
      return apiClient.get('/sessions', {}, options);
  },

  upsertSession: async (sessionData: any, locationId?: string) => {
      const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
      return apiClient.post('/sessions/upsert', sessionData, options);
  }
};
