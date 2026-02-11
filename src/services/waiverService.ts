import { apiClient } from './apiClient';

export interface WaiverTemplate {
  waiver_template_id: string;
  location_id: string;
  ageprofile_id: string | null;
  content: string;
  is_active: boolean;
}

export interface SignedWaiverResponse {
  success: boolean;
  signature_url: string;
}

export interface UpsertSignedWaiverPayload {
    profile_id: string | null;
    waiver_template_id: string;
    waiver_type: string;
    content: string;
    signature_url: string;
}

export interface UpsertSignedWaiverResponse {
    signed_waiver_id: string;
    [key: string]: any;
}

export const waiverService = {
  // Fetch all waiver templates for the current location
  getWaiverTemplates: async (locationId: string) => {
    return apiClient.get('/waiver-templates', {}, {
        headers: {
            'x-location-id': locationId
        }
    });
  },

  // Upload signature image
  uploadSignature: async (signatureBase64: string): Promise<SignedWaiverResponse> => {
    return apiClient.post('/signed-waivers/signature', { signature_base64: signatureBase64 });
  },

  // Persist signed waiver record
  upsertSignedWaiver: async (payload: UpsertSignedWaiverPayload, locationId: string): Promise<UpsertSignedWaiverResponse> => {
    return apiClient.post('/signed-waivers/upsert', payload, {
        headers: {
            'x-location-id': locationId
        }
    });
  }
};
