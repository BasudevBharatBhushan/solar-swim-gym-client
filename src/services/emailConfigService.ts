import { apiClient } from './apiClient';

export interface EmailConfig {
    config_id: string;
    location_id: string;
    smtp_host: string;
    smtp_port: number;
    sender_email: string;
    sender_name: string;
    smtp_username: string;
    smtp_password?: string;
    is_secure: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const emailConfigService = {
  getEmailConfig: async (locationId: string): Promise<EmailConfig | null> => {
    const options = { headers: { 'x-location-id': locationId } };
    const response = await apiClient.get('/email-config', {}, options);
    // Unpack data if wrapped in "data" property, based on sample response
    if (response && response.data) {
        return response.data;
    }
    return response as EmailConfig;
  },

  updateEmailConfig: async (locationId: string, data: Partial<EmailConfig>): Promise<EmailConfig> => {
    const options = { headers: { 'x-location-id': locationId } };
    // Assuming POST is used for updates as per prompt
    const response = await apiClient.post('/email-config', data, options);
     if (response && response.data) {
        return response.data;
    }
    return response as EmailConfig;
  }
};
