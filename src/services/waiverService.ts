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
    [key: string]: unknown;
}

export interface SignedWaiver {
    signed_waiver_id: string;
    profile_id: string;
    waiver_template_id: string;
    waiver_type: string;
    content: string;
    signature_url: string;
    location_id: string;
    signed_at: string;
    created_at: string;
    updated_at: string;
}

export interface GetSignedWaiversResponse {
    success: boolean;
    data: SignedWaiver[];
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
  },

  // Fetch signed waivers by profile ID
  getSignedWaivers: async (profileId: string, locationId: string): Promise<GetSignedWaiversResponse> => {
    return apiClient.get('/signed-waivers', { profile_id: profileId }, {
        headers: {
            'x-location-id': locationId
        }
    });
  },

  // Link an anonymous signed waiver to a profile
  linkProfileToWaiver: async (signedWaiverId: string, profileId: string, locationId: string) => {
    return apiClient.patch(`/signed-waivers/${signedWaiverId}/link-profile`, { profile_id: profileId }, {
        headers: {
            'x-location-id': locationId
        }
    });
  }
};
