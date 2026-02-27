import { apiClient } from './apiClient';

export interface SaveCardPayload {
  accountId: string;
  cardNumber: string;
  expiryMmYy: string;
  cardholderName: string;
  cvv: string; // Required for vaulting
  avsStreet?: string;
  avsZip?: string;
}

export interface SavedCardResponse {
  id: string; // The paymentMethodId
  account_id: string;
  vault_token: string;
  card_brand: string;
  last4_digits: string;
  expiry_mm_yy: string;
  is_default: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PayInvoicePayload {
  invoiceId: string;
  accountId: string;
  paymentMethodId: string; // Must be a tokenized card ID
  amountToBePaid?: number | null; // Optional: If omitted or null, charges the full AmountDue
  staff_id?: string | null;
  staff_name?: string | null;
}

export interface PaymentTransactionResponse {
  id: string;
  invoice_id: string;
  account_id: string;
  amount: number;
  gateway: string;
  gateway_transaction_token: string;
  approval_code: string;
  status: string;
  raw_response: any;
  created_at: string;
}

export const paymentService = {
  /**
   * Step 3A: Fetch Saved Cards
   */
  getSavedCards: async (accountId: string): Promise<SavedCardResponse[]> => {
    return apiClient.get('/payments/saved-cards', { account_id: accountId });
  },

  /**
   * Step 3B: Vault a New Card
   * Securely tokenizes a credit card through Cayan Vault.
   */
  saveCard: async (payload: SaveCardPayload): Promise<SavedCardResponse> => {
    return apiClient.post('/payments/save-card', payload);
  },

  /**
   * Step 4: Execute the Payment
   * Processes a sale against an existing invoice using a paymentMethodId (vault token).
   */
  payInvoice: async (payload: PayInvoicePayload): Promise<PaymentTransactionResponse> => {
    return apiClient.post('/payments/pay-invoice', payload);
  },

  /**
   * Part 2.2: Global History (Admin Only)
   */
  getAllTransactions: async (locationId?: string): Promise<PaymentTransactionResponse[]> => {
    const params = locationId ? { location_id: locationId } : {};
    return apiClient.get('/payments/transactions', params);
  },

  /**
   * Part 2.2: Account-Specific History
   */
  getAccountTransactions: async (accountId: string): Promise<PaymentTransactionResponse[]> => {
    return apiClient.get(`/payments/transactions/accounts/${accountId}`);
  }
};
