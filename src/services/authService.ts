import { apiClient, setToken, removeToken } from './apiClient';

export const authService = {
  // Staff Authentication
  loginStaff: async (email: string, password: string) => {
    const data = await apiClient.post('/auth/staff/login', { email, password });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  // User Authentication
  loginUser: async (email: string, password: string) => {
    const data = await apiClient.post('/auth/user/login', { email, password });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  logout: () => {
    removeToken();
  },

  // User Registration (with family members)
  registerUser: async (registrationData: any) => {
    // registrationData structure: { location_id, primary_profile, family_members }
    return apiClient.post('/auth/user/register', registrationData);
  },

  // Validate Activation Token
  validateActivationToken: async (token: string) => {
    return apiClient.get('/auth/user/activate', { token });
  },

  // Activate Account
  activateAccount: async (token: string, password: string) => {
    return apiClient.post('/auth/user/activate', { token, password });
  },

  // Switch Location (Superadmin)
  switchLocation: async (locationId: string) => {
    const data = await apiClient.post('/auth/switch-location', { location_id: locationId });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },
};
