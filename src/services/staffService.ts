import { apiClient } from './apiClient';

export interface StaffMember {
  staff_id: string;
  location_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  is_active: boolean;
  profile_image_url?: string;
  created_at?: string;
}

export interface UpsertStaffPayload {
  staff_id?: string;
  location_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: 'STAFF' | 'ADMIN';
}

export const staffService = {
  // Fetch all staff members
  getAllStaff: async () => {
    return apiClient.get('/auth/staff/all');
  },

  // Add or Update a staff member
  upsertStaff: async (payload: UpsertStaffPayload) => {
    return apiClient.post('/auth/staff/upsert', payload);
  },

  // Send Password Reset Link
  sendResetLink: async (staffId: string) => {
    return apiClient.post('/auth/staff/reset-password', { staff_id: staffId });
  },

  // Validate Admin Activation Token
  validateActivationToken: async (token: string) => {
    // Note: This endpoint is public, but apiClient handles it if we don't need auth headers
    // For public endpoints that might need to bypass interceptors if they add auth, 
    // we usually just use apiClient as is unless it strictly enforces auth.
    // Based on requirements: "GET {{baseUrl}}/auth/admin/activate?token={{token}}"
    return apiClient.get(`/auth/admin/activate?token=${token}`);
  },

  // Activate Admin/Staff Account (Set Password)
  activateAccount: async (token: string, password: string) => {
    return apiClient.post('/auth/admin/activate', { token, password });
  }
};
