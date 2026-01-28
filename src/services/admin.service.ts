
import { API_ENDPOINTS, buildApiUrl } from '../config/api.config';

import type {
  SubscriptionType,
  SubscriptionTypesResponse,
  Membership,
  MembershipsResponse,
  Service,
  ServicesListResponse,
  ServicePlan,
  ServicePlansResponse,
  MembershipPlan,
  MembershipPlansResponse,
  PaginatedResponse,
  AdminAccount,
  AdminProfile,
  Lead,
  SearchParams,
  LeadSearchParams,
  ApiError
} from '../types/api.types';

// Helper to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Generic admin fetcher
async function adminFetch<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
  const url = buildApiUrl(endpoint);
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    } as HeadersInit,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(url, options);

  // Try to parse JSON, but handle empty responses or text
  let data;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw {
      error: 'API Error',
      message: typeof data === 'string' ? data : (data.message || 'Unknown error'),
      statusCode: response.status,
    } as ApiError;
  }

  return data as T;
}

export const adminService = {
  // --- Subscription Types ---
  async getSubscriptionTypes(): Promise<SubscriptionType[]> {
    const data = await adminFetch<SubscriptionType[] | SubscriptionTypesResponse>(API_ENDPOINTS.ADMIN.SUBSCRIPTION_TYPES);
    let types: SubscriptionType[];
    if (Array.isArray(data)) {
      types = data;
    } else {
      types = (data as SubscriptionTypesResponse).subscription_types || [];
    }

    // Ensure each type has both subscription_type_id and id (aliased)
    return types.map(type => ({
      ...type,
      id: type.id || type.subscription_type_id,  // Alias subscription_type_id as id
      subscription_type_id: type.subscription_type_id || type.id
    }));
  },

  async createSubscriptionType(data: Partial<SubscriptionType>): Promise<SubscriptionType> {
    const result = await adminFetch<SubscriptionType>(API_ENDPOINTS.ADMIN.SUBSCRIPTION_TYPES, 'POST', data);
    // Ensure the result has both fields
    return {
      ...result,
      id: result.id || result.subscription_type_id,
      subscription_type_id: result.subscription_type_id || result.id
    };
  },

  // --- Services ---
  async getServices(): Promise<Service[]> {
    const data = await adminFetch<Service[] | ServicesListResponse>(API_ENDPOINTS.ADMIN.SERVICES);
    let services: Service[];
    if (Array.isArray(data)) {
      services = data;
    } else {
      services = (data as ServicesListResponse).services || [];
    }

    // Ensure each service has both service_id and id (aliased)
    return services.map(service => ({
      ...service,
      id: service.id || service.service_id,  // Alias service_id as id
      service_id: service.service_id || service.id
    }));
  },

  async createService(data: Partial<Service>): Promise<Service> {
    const result = await adminFetch<Service>(API_ENDPOINTS.ADMIN.SERVICES, 'POST', data);
    // Ensure the result has both fields
    return {
      ...result,
      id: result.id || result.service_id,
      service_id: result.service_id || result.id
    };
  },

  // --- Memberships ---
  async getMemberships(): Promise<Membership[]> {
    const data = await adminFetch<Membership[] | MembershipsResponse>(API_ENDPOINTS.ADMIN.MEMBERSHIPS);
    if (Array.isArray(data)) return data;
    return (data as MembershipsResponse).memberships || [];
  },

  async createMembership(data: Partial<Membership>): Promise<Membership> {
    return adminFetch<Membership>(API_ENDPOINTS.ADMIN.MEMBERSHIPS, 'POST', data);
  },

  // --- Service Plans (Pricing) ---
  async getServicePlans(): Promise<ServicePlan[]> {
    const data = await adminFetch<ServicePlan[] | ServicePlansResponse>(API_ENDPOINTS.ADMIN.SERVICE_PLANS);
    if (Array.isArray(data)) return data;
    return (data as ServicePlansResponse).plans || [];
  },

  async createServicePlan(data: Partial<ServicePlan>): Promise<ServicePlan> {
    return adminFetch<ServicePlan>(API_ENDPOINTS.ADMIN.SERVICE_PLANS, 'POST', data);
  },

  async updateServicePlan(id: string, data: Partial<ServicePlan>): Promise<ServicePlan> {
    return adminFetch<ServicePlan>(`${API_ENDPOINTS.ADMIN.SERVICE_PLANS}/${id}`, 'PATCH', data);
  },

  // --- Membership Plans (Pricing) ---
  async getMembershipPlans(): Promise<MembershipPlan[]> {
    const data = await adminFetch<MembershipPlan[] | MembershipPlansResponse>(API_ENDPOINTS.ADMIN.MEMBERSHIP_PLANS);
    if (Array.isArray(data)) return data;
    return (data as MembershipPlansResponse).plans || [];
  },

  async createMembershipPlan(data: Partial<MembershipPlan>): Promise<MembershipPlan> {
    return adminFetch<MembershipPlan>(API_ENDPOINTS.ADMIN.MEMBERSHIP_PLANS, 'POST', data);
  },

  async updateMembershipPlan(id: string, data: Partial<MembershipPlan>): Promise<MembershipPlan> {
    return adminFetch<MembershipPlan>(`${API_ENDPOINTS.ADMIN.MEMBERSHIP_PLANS}/${id}`, 'PATCH', data);
  },

  // --- Membership Services (Bundling) ---
  async assignServiceToMembership(membershipId: string, serviceId: string, accessType: string = 'CORE'): Promise<any> {
    return adminFetch(`${API_ENDPOINTS.ADMIN.MEMBERSHIPS}/${membershipId}/services`, 'POST', { serviceId, accessType });
  },

  async getMembershipServices(membershipId: string): Promise<any[]> {
    return adminFetch<any[]>(`${API_ENDPOINTS.ADMIN.MEMBERSHIPS}/${membershipId}/services`);
  },

  // --- Search & Audit ---
  async getAccounts(params: SearchParams): Promise<PaginatedResponse<AdminAccount>> {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await adminFetch<any>(`${API_ENDPOINTS.ADMIN.ACCOUNTS}?${queryParams.toString()}`);

    // Handle different response structures
    const rawList = response.hits || response.data || response.results || (Array.isArray(response) ? response : []);
    const total = response.total || response.count || (Array.isArray(response) ? response.length : rawList.length);

    const results = rawList.map((item: any) => ({
      ...item,
      id: item.id || item.account_id, // Map account_id to id
      account_name: item.account_name || item.name || item.email || item.account_id || 'Unknown Account',
      primary_profile_email: item.primary_profile_email || item.email,
      primary_profile_name: item.primary_profile_name || item.account_name || item.name || 'Account Contact'
    }));

    return { results, total, page: params.page, limit: params.limit };
  },

  async getProfiles(params: SearchParams): Promise<PaginatedResponse<AdminProfile>> {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await adminFetch<any>(`${API_ENDPOINTS.ADMIN.PROFILES}?${queryParams.toString()}`);

    // Handle different response structures
    const rawList = response.hits || response.data || response.results || (Array.isArray(response) ? response : []);
    const total = response.total || response.count || (Array.isArray(response) ? response.length : rawList.length);

    const results = rawList.map((item: any) => ({
      ...item,
      id: item.id || item.profile_id, // Map profile_id to id
      name: item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Profile',
      is_rceb: item.is_rceb !== undefined ? item.is_rceb : item.rceb_flag
    }));

    return { results, total, page: params.page, limit: params.limit };
  },

  async getLeads(params: LeadSearchParams): Promise<PaginatedResponse<Lead>> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.q) queryParams.append('search', params.q);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.source) queryParams.append('source', params.source);
    if (params.useElasticsearch !== undefined) queryParams.append('useElasticsearch', params.useElasticsearch.toString());

    const response = await adminFetch<any>(`${API_ENDPOINTS.LEADS.LIST}?${queryParams.toString()}`);

    // Handle different response structures
    const rawList = response.hits || response.data || response.results || (Array.isArray(response) ? response : []);
    const total = response.total || response.count || (Array.isArray(response) ? response.length : rawList.length);

    const results = rawList.map((item: any) => ({
      ...item,
      id: item.id || item.lead_id, // Map lead_id to id
    }));

    return { results, total, page: params.page, limit: params.limit };
  }
};
