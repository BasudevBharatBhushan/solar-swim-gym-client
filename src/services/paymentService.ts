import { apiClient } from './apiClient';

export interface SaveCardPayload {
  accountId: string;
  cardNumber: string;
  expiryMmYy: string;
  cardholderName: string;
  avsStreet?: string;
  avsZip?: string;
}

export interface SavedCardResponse {
  id: string;
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

export interface PayInvoiceExistingCardPayload {
  invoiceId: string;
  accountId: string;
  paymentMethodId: string;
}

export interface PayInvoiceNewCardPayload {
  invoiceId: string;
  accountId: string;
  newCardData: {
    cardNumber: string;
    expiryMmYy: string;
    cardholderName: string;
  };
}

export type PayInvoicePayload = PayInvoiceExistingCardPayload | PayInvoiceNewCardPayload;

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
   * Securely tokenizes a credit card through Cayan Vault and saves the reference to the user's account.
   */
  saveCard: async (payload: SaveCardPayload): Promise<SavedCardResponse> => {
    return apiClient.post('/payments/save-card', payload);
  },

  /**
   * Retrieves a list of all active tokenized cards saved for a specific account.
   */
  getSavedCards: async (accountId: string): Promise<SavedCardResponse[]> => {
    return apiClient.get('/payments/saved-cards', { account_id: accountId });
  },

  /**
   * Processes a sale against an existing invoice.
   * Supports paying with either a newly entered card or a previously saved card.
   */
  payInvoice: async (payload: PayInvoicePayload): Promise<PaymentTransactionResponse> => {
    return apiClient.post('/payments/pay-invoice', payload);
  }
};
