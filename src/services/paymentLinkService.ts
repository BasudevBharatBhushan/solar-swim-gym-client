import { apiClient } from './apiClient';
import { PaymentLinkResponse } from '../types';

interface GeneratePaymentLinkPayload {
  invoice_id: string;
  account_id: string;
  amount_to_be_paid: number;
  expires_in_days?: number;
}

export const paymentLinkService = {
  /**
   * Generates a new payment link for an invoice.
   * Requires Admin/Staff auth.
   */
  generatePaymentLink: async (payload: GeneratePaymentLinkPayload): Promise<PaymentLinkResponse> => {
    const response = await apiClient.post('/payment-links', payload);
    return response;
  }
};
