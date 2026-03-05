import { apiClient } from './apiClient';

export interface SearchParams {
  q?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  account_id?: string;
}

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

  // PATCH /billing/subscriptions/:subscriptionId — lifecycle/status/auto-renew
  patchSubscription: async (
    subscriptionId: string,
    payload: { status?: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'PENDING_PAYMENT' | 'CANCELLED'; auto_renew?: boolean; staff_id?: string },
    locationId?: string
  ) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.patch(`/billing/subscriptions/${subscriptionId}`, payload, options);
  },

  // PATCH /billing/subscriptions/:subscriptionId/pricing — pricing/billing snapshots
  patchSubscriptionPricing: async (
    subscriptionId: string,
    payload: { unit_price_snapshot?: number; total_amount?: number; next_renewal_date?: string; billing_period_start?: string },
    locationId?: string
  ) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.patch(`/billing/subscriptions/${subscriptionId}/pricing`, payload, options);
  },

  // Invoices & Payments
  getInvoices: async (locationId?: string, params?: SearchParams) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/invoices', params, options);
  },

  createInvoice: async (invoiceData: any, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/invoices', invoiceData, options);
  },

  getAccountInvoices: async (accountId: string, locationId?: string, params?: SearchParams) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/invoices/accounts/${accountId}`, params, options);
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

  // Transactions
  getAllTransactions: async (locationId?: string, params?: SearchParams) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get('/payments/transactions', params, options);
  },

  getAccountTransactions: async (accountId: string, locationId?: string, params?: SearchParams) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/payments/transactions/accounts/${accountId}`, params, options);
  },

  getSavedCards: async (accountId: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.get(`/payments/saved-cards?account_id=${accountId}`, {}, options);
  },

  saveCard: async (cardData: any, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/payments/save-card', cardData, options);
  },

  voidTransaction: async (data: { transactionId: string, invoiceId: string, accountId: string }, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/payment/void', data, options);
  },

  refundTransaction: async (data: { transactionId: string, invoiceId: string, accountId: string, refundAmount?: number }, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post('/payment/refund', data, options);
  },

  cancelInvoice: async (invoiceId: string, locationId?: string) => {
    const options = locationId ? { headers: { 'x-location-id': locationId } } : {};
    return apiClient.post(`/invoices/${invoiceId}/cancel`, { voidPaymentInGateway: false }, options);
  },
};
