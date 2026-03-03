# Implementation Plan: Billing Enhancements

This plan outlines the enhancements to the billing system, focusing on payment failure resilience, administrative controls for invoices, and improved card management.

## Proposed Changes

---

### Billing Service

#### [MODIFY] [billingService.ts](file:///e:/Dev/REACT/solar-swim-project-ii/src/services/billingService.ts)

- Add `cancelInvoice` method.
- Add `saveCard` method.

---

### Payment Dialog

#### [MODIFY] [PaymentDialog.tsx](file:///e:/Dev/REACT/solar-swim-project-ii/src/pages/Marketplace/PaymentDialog.tsx)

- Update error handling in `handlePay` to parse JSON error responses.
- Display detailed gateway errors if available.
- Add a **Retry** button when a payment fails.
- Ensure the **Skip Payment** button is prominent on failure to allow users to proceed without immediate payment.

---

### Invoice Management

#### [MODIFY] [InvoicesTab.tsx](file:///e:/Dev/REACT/solar-swim-project-ii/src/pages/Accounts/components/InvoicesTab.tsx)

- Add a **Cancel** menu item or button for each invoice row (active for PENDING/PARTIAL/PAID invoices).
- Integrate `ManagerPasscodeDialog` to authorize cancellation.
- Implement cancellation logic:
    - If PAID/PARTIAL, prompt user if they want to `voidPaymentInGateway`.
    - Call `billingService.cancelInvoice` upon successful passcode entry.
    - Refresh the invoice list after cancellation.

---

### Card Management

#### [MODIFY] [SavedCardsTab.tsx](file:///e:/Dev/REACT/solar-swim-project-ii/src/pages/Accounts/components/SavedCardsTab.tsx)

- Add an **Add New Card** button.
- Implement a dialog/modal containing the credit card form (Cardholder Name, Card Number, Expiry, CVV, Zip).
- Use `billingService.saveCard` to vault the card securely.
- Refresh the card list upon successful vaulting.

---

## Verification Plan

### Manual Verification

1.  **Payment Failure Flow**:
    - Open `PaymentDialog`.
    - Inject/Simulate a payment failure (e.g., use a test card that triggers a decline if available in sandbox, or mock the service call).
    - Verify that the error message is displayed correctly.
    - Verify that the "Retry" button resets the state for another attempt.
    - Verify that "Skip Payment" allows closing the dialog and proceeding.

2.  **Invoice Cancellation**:
    - Go to an account's Invoices tab.
    - Click "Cancel" on an invoice.
    - Verify the `ManagerPasscodeDialog` appears.
    - Enter an incorrect passcode and verify failure.
    - Enter the correct passcode and verify the invoice status changes to `CANCELLED`.
    - For PAID invoices, verify the option to void payment is presented and handled.

3.  **Manual Card Saving**:
    - Go to Account Details -> Saved Cards.
    - Click "Add New Card".
    - Fill in test card details and save.
    - Verify the new card appears in the list.
