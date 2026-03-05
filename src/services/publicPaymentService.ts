import axios from 'axios';
import { PaymentLinkDetails, PaymentLinkPayResponse } from '../types';

// Create a separate unauthenticated axios instance for public routes
const publicApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const publicPaymentService = {
  /**
   * Retrieves payment link details by token.
   * No auth required.
   */
  getPaymentLink: async (token: string): Promise<PaymentLinkDetails> => {
    const response = await publicApiClient.get(`/public/payment-link/${token}`);
    return response.data;
  },

  /**
   * Processes a payment using either a saved card or new card details.
   * No auth required.
   */
  payWithLink: async (token: string, payload: any): Promise<PaymentLinkPayResponse> => {
    const response = await publicApiClient.post(`/public/payment-link/${token}/pay`, payload);
    return response.data;
  }
};
