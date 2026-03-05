import { apiClient } from './apiClient';

export interface EmailTemplate {
    email_template_id: string;
    location_id: string;
    subject: string;
    body_content: string;
    created_at: string;
    updated_at: string;
}

export interface CreateTemplateRequest {
    location_id?: string;
    subject: string;
    body_content: string;
}

export interface UpdateTemplateRequest {
    email_template_id: string;
    location_id?: string;
    subject?: string;
    body_content?: string;
}

export interface SendEmailRequest {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
    from?: string;
    fromName?: string;
    toName?: string;
    cc?: string; // comma-separated
    bcc?: string; // comma-separated
    location_id?: string;
    account_id?: string;
    staff_id?: string;
    email_template_id?: string;
    attachments?: File[];
}

export interface EmailLog {
    email_log_id: string;
    location_id: string;
    account_id?: string;
    staff_id?: string;
    sender_email: string;
    sender_name: string;
    receiver_email: string;
    subject: string;
    content: string;
    timestamp: string;
    is_email_sent: boolean;
    email_template_id?: string;
}

export const emailService = {
    // Templates
    getTemplates: async (locationId: string): Promise<EmailTemplate[]> => {
        const response = await apiClient.get('/emails/templates', {}, { headers: { 'x-location-id': locationId } });
        return response;
    },

    createTemplate: async (data: CreateTemplateRequest): Promise<EmailTemplate> => {
        const headers: Record<string, string> = {};
        if (data.location_id) {
            headers['x-location-id'] = data.location_id;
        }
        const response = await apiClient.post('/emails/templates', data, { headers });
        return response;
    },

    updateTemplate: async (templateId: string, data: UpdateTemplateRequest): Promise<EmailTemplate> => {
        const headers: Record<string, string> = {};
        if (data.location_id) {
            headers['x-location-id'] = data.location_id;
        }
        const response = await apiClient.post('/emails/templates', { ...data, email_template_id: templateId }, { headers });
        return response;
    },

    // Sending
    sendEmail: async (data: SendEmailRequest): Promise<EmailLog> => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && key !== 'attachments') {
                formData.append(key, String(value));
            }
        });

        if (data.attachments) {
            data.attachments.forEach((file) => {
                formData.append('attachments', file);
            });
        }
        
        const headers: Record<string, string> = {};
        if (data.location_id) {
            headers['x-location-id'] = data.location_id;
        }

        const response = await apiClient.upload('/emails/send', formData, { headers });
        return response;
    }
};
