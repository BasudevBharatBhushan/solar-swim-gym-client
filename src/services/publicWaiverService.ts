import { apiClient } from './apiClient';

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

export const publicWaiverService = {
  // Fetch a waiver request via public token
  getWaiverDetails: async (token: string): Promise<PublicWaiverDetailsResponse> => {
    return apiClient.get(`/public/waiver-request/${token}`);
  },

  // Submit a public waiver signature
  submitWaiver: async (token: string, payload: SubmitPublicWaiverPayload) => {
    return apiClient.post(`/public/waiver-request/${token}/submit`, payload);
  }
};
