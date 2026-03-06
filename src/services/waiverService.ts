import { apiClient } from './apiClient';

export interface WaiverTemplate {
  waiver_template_id: string;
  location_id: string;
  ageprofile_id: string | null;
  service_id?: string | null;
  membership_category_id?: string | null;
  base_price_id?: string | null;
  subterm_id?: string | null;
  template_category?: string | null;
  content: string;
  is_active: boolean;
  is_before_payment?: boolean;
  is_after_payment_info_captured?: boolean;
  is_after_payment?: boolean;
}

export interface GroupedWaiverTemplate {
  template_name: string;
  template_category: string;
  content: string;
  is_before_payment?: boolean;
  is_after_payment_info_captured?: boolean;
  is_after_payment?: boolean;
  assignments: {
    service_ids: string[];
    membership_category_ids: string[];
    base_price_ids: string[];
    ageprofile_ids: string[];
    subterm_ids: string[];
  };
}

export interface BatchUpsertWaiverPayload {
  template_name: string;
  template_category: string;
  content: string;
  location_id: string;
  is_before_payment?: boolean;
  is_after_payment_info_captured?: boolean;
  is_after_payment?: boolean;
  assignments: {
    service_ids: string[];
    membership_category_ids: string[];
    base_price_ids: string[];
    ageprofile_ids: string[];
    subterm_ids: string[];
  };
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
    return apiClient.get('/waiver-templates', locationId ? { location_id: locationId } : {}, options);
  },

  // Create public waiver signing request link
  createWaiverRequest: async (payload: CreateWaiverRequestPayload, locationId?: string): Promise<WaiverRequestResponse> => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/waiver-requests', payload, options);
  },

  // Fetch a waiver request via public token (Moved to publicWaiverService natively, leaving for backwards compat but shouldn't be used)
  getPublicWaiverRequest: async (token: string): Promise<PublicWaiverDetailsResponse> => {
    return apiClient.get(`/public/waiver-request/${token}`);
  },

  // Submit a public waiver signature (Moved to publicWaiverService)
  submitPublicWaiver: async (token: string, payload: SubmitPublicWaiverPayload) => {
    return apiClient.post(`/public/waiver-request/${token}/submit`, payload);
  },

  // Get Waiver Status (Pending/Signed)
  getWaiverStatus: async (params: { account_id: string; profile_id?: string; status?: 'pending' | 'signed' }) => {
    return apiClient.get('/waivers/status', params);
  },

  // Link Signed Waiver to a Subscription
  linkWaiverToSubscription: async (subscriptionId: string, payload: { signedwaiver_id: string }) => {
    return apiClient.patch(`/subscriptions/${subscriptionId}/waiver`, payload);
  },

  // Get a single Signed Waiver by ID
  getSignedWaiver: async (signedWaiverId: string) => {
    return apiClient.get(`/signed-waivers/${signedWaiverId}`);
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
  },

  // Fetch grouped waiver templates for admin UI
  getGroupedWaiverTemplates: async (locationId?: string): Promise<GroupedWaiverTemplate[]> => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/waiver-templates/grouped', locationId ? { location_id: locationId } : {}, options);
  },

  // Batch upsert a template
  batchUpsertWaiverTemplate: async (payload: BatchUpsertWaiverPayload): Promise<any> => {
    return apiClient.post('/waiver-templates/batch-upsert', payload, {
        headers: {
            'x-location-id': payload.location_id
        }
    });
  },

  // Standard upsert for a single template
  upsertWaiverTemplate: async (payload: Partial<WaiverTemplate>, locationId: string): Promise<any> => {
    return apiClient.post('/waiver-templates/upsert', payload, {
        headers: {
            'x-location-id': locationId
        }
    });
  },

  // Fetch a waiver template by its ID
  getWaiverTemplateById: async (id: string, locationId?: string): Promise<WaiverTemplate> => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/waiver-templates/${id}`, {}, options);
  }
};
