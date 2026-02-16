import { apiClient } from './apiClient';

export interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  [key: string]: any;
}

export interface ProfileResult extends Profile {
  profile_id: string;
  account_id: string;
  location_id: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export interface SearchProfilesResponse {
  total: number;
  results: ProfileResult[];
}

export interface SearchProfilesParams {
  q?: string;
  from?: number;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  elastic?: boolean;
  locationId?: string;
}

export const accountService = {
  searchProfiles: async (params: SearchProfilesParams): Promise<SearchProfilesResponse> => {
    const queryParams: Record<string, string> = {
      location_id: params.locationId || '',
      q: params.q || '',
      from: (params.from !== undefined ? params.from : 0).toString(),
      size: (params.size !== undefined ? params.size : 10).toString(),
      elastic: params.elastic ? 'true' : 'false'
    };

    if (params.sort) queryParams.sort = params.sort;
    if (params.order) queryParams.order = params.order;

    return apiClient.get('/profile-search-verify', queryParams);
  },
};
