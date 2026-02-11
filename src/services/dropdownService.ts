import { apiClient } from './apiClient';

export interface DropdownValue {
  dropdown_id?: string;
  module: string;
  label: string;
  value: string;
  location_id?: string;
}

export const dropdownService = {
  getAll: async (locationId?: string, filters: { module?: string; label?: string } = {}) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/dropdown-values', filters, options);
  },

  upsert: async (data: DropdownValue, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/dropdown-values/upsert', data, options);
  },

  delete: async (id: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.delete(`/dropdown-values/${id}`, options);
  },
};
