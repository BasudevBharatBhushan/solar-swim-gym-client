import { apiClient } from './apiClient';
type JsonObject = Record<string, unknown>;
type JsonResponse = Record<string, unknown>;

export const billingService = {
  // Subscriptions
  createSubscription: async (subscriptionData: JsonObject, locationId?: string): Promise<JsonResponse> => {
    // subscriptionData: { account_id, location_id, subscription_type, ... }
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/billing/subscriptions', subscriptionData, options);
  },

  getAccountSubscriptions: async (accountId: string, locationId?: string): Promise<JsonResponse> => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/billing/accounts/${accountId}/subscriptions`, {}, options);
  },

  // Invoices & Payments
  getInvoice: async (invoiceId: string): Promise<JsonResponse> => {
    return apiClient.get(`/invoices/${invoiceId}`);
  },

  recordPayment: async (paymentData: JsonObject): Promise<JsonResponse> => {
    // paymentData: { invoice_id, amount, method, ref }
    return apiClient.post('/payments', paymentData);
  },

  // Waivers
  getWaivers: async (): Promise<JsonResponse> => {
    return apiClient.get('/waivers');
  },

  upsertWaiver: async (waiverData: JsonObject): Promise<JsonResponse> => {
    return apiClient.post('/waivers', waiverData);
  },
};
