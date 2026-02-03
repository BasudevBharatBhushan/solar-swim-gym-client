import { apiClient } from './apiClient';

export const billingService = {
  // Subscriptions
  createSubscription: async (subscriptionData: any) => {
    // subscriptionData: { account_id, location_id, subscription_type, ... }
    return apiClient.post('/billing/subscriptions', subscriptionData);
  },

  getAccountSubscriptions: async (accountId: string) => {
    return apiClient.get(`/billing/accounts/${accountId}/subscriptions`);
  },

  // Invoices & Payments
  getInvoice: async (invoiceId: string) => {
    return apiClient.get(`/invoices/${invoiceId}`);
  },

  recordPayment: async (paymentData: any) => {
    // paymentData: { invoice_id, amount, method, ref }
    return apiClient.post('/payments', paymentData);
  },

  // Waivers
  getWaivers: async () => {
    return apiClient.get('/waivers');
  },

  upsertWaiver: async (waiverData: any) => {
    return apiClient.post('/waivers', waiverData);
  },
};
