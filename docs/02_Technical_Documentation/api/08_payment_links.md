# API: Public Payment Links

**Base URL**: `/api/v1`

---

## 8.1 Link Generation (Staff/Admin)
Endpoints for generating unique, secure tokens for sign-in-less payments.

### **POST** `/payment-links`
- **Purpose**: Create a new payment link for a specific invoice.
- **Auth**: Requires Admin/Staff role via JWT.
- **Payload**:
  ```json
  {
    "invoice_id": "uuid",
    "account_id": "uuid",
    "amount_to_be_paid": 50.00,
    "expires_in_days": 7
  }
  ```
- **Validation**:
  - `amount_to_be_paid` cannot exceed the current `AmountDue` on the invoice.
  - The invoice must belong to the `account_id`.
  - The invoice must not already be in `PAID` status.
- **Response** (201 Created):
  ```json
  {
    "message": "Payment link created successfully",
    "token": "uuid",
    "expires_at": "timestamp",
    "id": "uuid"
  }
  ```

---

## 8.2 Public Payment Interface
These endpoints do **not** require a JWT but are secured by the unique `token`.

### **GET** `/public/payment-link/:token`
- **Purpose**: Retrieve invoice and location details to display on a branded payment page.
- **Response** (200 OK):
  ```json
  {
    "id": "uuid",
    "token": "uuid",
    "invoice_id": "uuid",
    "account_id": "uuid",
    "location_id": "uuid",
    "amount_to_be_paid": 50.00,
    "status": "pending",
    "expires_at": "timestamp",
    "invoice_no": "1001",
    "location_name": "Solar Swim Gym Brisbane",
    "profile_name": "John Doe",
    "saved_methods": [
      {
        "id": "uuid",
        "brand": "Visa",
        "last4": "1111",
        "expiry": "1225"
      }
    ]
  }
  ```
- **Error Scenarios**:
  - `404 Not Found`: Token does not exist.
  - `404 Not Found`: Link is `paid`, `expired`, or `cancelled`.

### **POST** `/public/payment-link/:token/pay`
- **Purpose**: Execute a payment against the link using a saved card or new card data.
- **Payload (Saved Card)**:
  ```json
  {
    "paymentMethodId": "uuid"
  }
  ```
- **Payload (New Card)**:
  ```json
  {
    "cardNumber": "...",
    "expiryMmYy": "MMYY",
    "cardholderName": "...",
    "cvv": "..."
  }
  ```
- **Logic**:
  - Validates the link token status.
  - Calls the atomic `payInvoice` service using the preset `amount_to_be_paid`.
  - Marks the `payment_links` record as `paid` upon success.
- **Response** (200 OK):
  ```json
  {
    "message": "Payment processed successfully",
    "transaction": {
      "id": "uuid",
      "status": "APPROVED",
      "amount": 50.00,
      "approval_code": "..."
    }
  }
  ```

---

## 8.3 Security & Lifecycle
1. **Expiry**: Links default to 7 days. Once expired, the `GET` endpoint returns a `404` with a specific error message.
2. **Single Use**: Once a payment is successful, the link status moves to `paid`. Subsequent requests for that token will fail.
3. **Partial Payments**: If the `amount_to_be_paid` is less than the total `AmountDue`, the invoice will correctly reflect the remaining balance in the database, and the link will be marked as `paid`.
