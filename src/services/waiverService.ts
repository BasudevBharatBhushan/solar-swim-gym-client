import { apiClient } from './apiClient';

export interface WaiverTemplate {
  waiver_template_id: string;
  location_id: string;
  ageprofile_id: string | null;
  service_id?: string | null;
  membership_category_id?: string | null;
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

export interface CreateWaiverRequestPayload {
  account_id: string;
  profile_id: string;
  waiver_template_id: string;
  waiver_type: string;
  expires_in_days?: number;
  variables: Record<string, any>;
}

export interface WaiverRequestResponse {
  success: boolean;
  data: {
    request_id: string;
    account_id: string;
    token: string;
    public_signing_url: string;
    expires_at: string;
  }
}

export interface PublicWaiverDetailsResponse {
  success: boolean;
  data: {
    account_id: string;
    profile_id: string;
    waiver_type: string;
    location_name: string;
    template_content: string;
    resolved_variables: Record<string, string>;
  }
}

export interface SubmitPublicWaiverPayload {
  signature_base64: string;
  final_content: string;
  agreed: boolean;
}

export const waiverService = {
  // Fetch all waiver templates
  getWaiverTemplates: async (locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/waiver-templates', {}, options);
  },

  // Create public waiver signing request link
  createWaiverRequest: async (payload: CreateWaiverRequestPayload, locationId?: string): Promise<WaiverRequestResponse> => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/waiver-requests', payload, options);
  },

  // Fetch a waiver request via public token
  getPublicWaiverRequest: async (token: string): Promise<PublicWaiverDetailsResponse> => {
    return apiClient.get(`/public/waiver-request/${token}`);
  },

  // Submit a public waiver signature
  submitPublicWaiver: async (token: string, payload: SubmitPublicWaiverPayload) => {
    return apiClient.post(`/public/waiver-request/${token}/submit`, payload);
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
