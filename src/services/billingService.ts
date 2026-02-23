import { apiClient } from './apiClient';

export const billingService = {
  // Subscriptions
  createSubscription: async (subscriptionData: any, locationId?: string) => {
    // subscriptionData: { account_id, location_id, subscription_type, ... }
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/billing/subscriptions', subscriptionData, options);
  },

  getAccountSubscriptions: async (accountId: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/billing/accounts/${accountId}/subscriptions`, {}, options);
  },

  // Invoices & Payments
  createInvoice: async (invoiceData: any, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/invoices', invoiceData, options);
  },

  getAccountInvoices: async (accountId: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/invoices/accounts/${accountId}`, {}, options);
  },

  getInvoice: async (invoiceId: string) => {
    return apiClient.get(`/invoices/${invoiceId}`);
  },

  updateSubscriptionInvoice: async (subscriptionId: string, invoiceId: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.patch(`/billing/subscriptions/${subscriptionId}/pricing`, { invoice_id: invoiceId }, options);
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

  // Send Payment Link
  sendPaymentLink: async (accountId: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/billing/payment-link', { account_id: accountId }, options);
  },
};
