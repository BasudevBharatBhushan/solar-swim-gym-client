# Implementation Plan: Public Payment Links (Frontend)

## 1. Overview & Scope
The goal of this implementation is to allow Admin/Staff users to generate secure payment links for specific invoices and email them directly to customers from the portal. The customer can then click the link to be directed to a secure, unauthenticated public payment page where they can complete their purchase using an existing saved card or a new card.

---

## 2. API Service Integration

### 2.1 Update/Create Admin Services
Create or update `src/services/paymentLinkService.ts` (or add to `billingService.ts`):
- `generatePaymentLink(payload)`: Hits `POST /payment-links`.
  - Payload requires: `invoice_id`, `account_id`, `amount_to_be_paid`, `expires_in_days`.
  - Authenticated via standard `apiClient`.

### 2.2 Create Public Services
Create `src/services/publicPaymentService.ts`:
- **`getPaymentLink(token: string)`**: Hits `GET /public/payment-link/:token`.
  - No authentication required.
  - Returns `invoice_no`, `location_name`, `profile_name`, `amount_to_be_paid`, status, constraints, and an array of `saved_methods`.
- **`payWithLink(token: string, payload: any)`**: Hits `POST /public/payment-link/:token/pay`.
  - Payload accepts either `paymentMethodId` (for saved cards) OR new card details (`cardNumber`, `expiryMmYy`, `cardholderName`, `cvv`).

---

## 3. Admin/Staff UI Modifications

### 3.1 Invoice Action Menu Additions
- **Target Files**: `src/pages/Accounts/components/InvoicesTab.tsx` and `src/pages/Billing/GlobalInvoices.tsx`.
- Add a **"Send Payment Link"** action inside the row actions (three-dots menu) for any invoice where `status !== 'PAID'` and `AmountDue > 0`.

### 3.2 Create `GeneratePaymentLinkDialog.tsx`
Create a new standalone dialog component imported into the invoice lists.
- **Inputs**:
  - **Amount to Pay**: Pre-filled with `invoice.AmountDue`. Required and max validator set to `AmountDue`.
  - **Expiry (Days)**: Pre-filled to `7`.
  - **Recipient Email**: Pre-filled using the `account.email` context.
- **Actions**:
  - **Generate & Copy**: Calls `generatePaymentLink` to grab the secure token. Constructs the frontend URL (`window.location.origin + '/public/pay/' + token`) and copies it to the staff member's clipboard.
  - **Generate & Send Email**: 
    1. Calls `generatePaymentLink` and constructs the public payment link.
    2. Opens the `EmailComposer` component (from `src/components/Email/EmailComposer.tsx`) in a sub-dialog or nested state.
    3. **Preload Content**:
       - `initialTo`: Set to account email.
       - `initialSubject`: `"Payment Request for Invoice #${invoice_no}"`.
       - `initialBody`: A simple summary followed by the link:
         ```text
         Hello,
         
         Please find the secure payment link for your invoice below:
         ${paymentLink}
         
         Total Amount: $${amount}
         
         Thank you!
         ```
    4. Staff can review/edit and then hit "Send Email" which calls `emailService.sendEmail`.
    5. Displays a success Snackbar on completion.

---

## 4. Public Payment Page (Sign-in-less)

### 4.1 Routing
- **Target File**: `src/App.tsx`.
- **Update**: Add the routing path `<Route path="/public/pay/:token" element={<PublicPayment />} />` alongside existing public routes (e.g., `/public/sign-waiver`).

### 4.2 Create `src/pages/PublicPayment/PublicPayment.tsx`
Create a branded, customer-facing checkout page that requires no login.
- **On Mount**: Extracts `:token` with `useParams()` and calls `publicPaymentService.getPaymentLink(token)`.
- **State Handling**:
  - **Loading**: Render a clear loading spinner.
  - **Error/Invalid**: Handle `404` (Token Not Found, Expired, or Already Paid) with a user-friendly error layout instructing the client to contact the establishment.
  - **Success (Valid Link)**: Display simple summary: Location (`location_name`), Profile (`profile_name`), Invoice (`invoice_no`), and exact Amount Due (`amount_to_be_paid`).
- **Payment Interface Construction**:
  - Provide a choice (Radio Group / Tabs): **"Use Saved Card"** vs **"New Card"**.
  - **Saved Card View**: Iterate and display the masked `saved_methods` strictly from the API payload (`brand`, `last4`, `expiry`).
  - **New Card View**: Render standard inputs (Card Number, MM/YY, Name, CVV) similar to our existing `PaymentDialog`.
  - **Pay Button**: Maps to `payWithLink`. Maintains loading state during execution.
- **Post-Payment**: Remove the form and present a clean "Payment Successful" receipt component using the returned transaction details (`transaction.id`, `transaction.amount`, `approval_code`).

---

## 5. Execution Checklist for Developer
- [ ] Define types/interfaces in `src/types/index.ts` for payment link responses.
- [ ] Bootstrap `publicPaymentService.ts` and update backend services.
- [ ] Create `GeneratePaymentLinkDialog.tsx` and embed it in all Invoice list views.
- [ ] Construct the unauthenticated flow via `App.tsx` layout tweaks.
- [ ] Develop the standalone `PublicPayment.tsx` and relevant card input handlers.
- [ ] Verify End-to-End flow: Generates linking token -> Emails user -> User pays without auth -> Status changes successfully to PAID.
