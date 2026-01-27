
import { API_ENDPOINTS, buildApiUrl } from '../config/api.config';
import { api } from './api.service';
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
    },
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
  }
};
