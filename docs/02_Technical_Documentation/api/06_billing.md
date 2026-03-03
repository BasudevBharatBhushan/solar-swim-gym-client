# API: Billing, Subscriptions, Payments & Cart

**Base URL**: `/api/v1`

---

## 7.1 Cart Management
Endpoints for managing the member's shopping cart before checkout.

### **POST** `/cart/upsert`
- **Purpose**: Add or update an item in the cart.
- **Payload**:
  ```json
  {
    "account_id": "uuid",
    "location_id": "uuid",
    "subscription_type": "SERVICE | MEMBERSHIP_FEE",
    "reference_id": "uuid",
    "total_amount": 150.00,
    "unit_price_snapshot": 150.00,
    "auto_renew": true,
    "prorate_enabled": false,
    "role": "PRIMARY"
  }
  ```
- **Response** (201 Created): Returns the created cart object.

### **GET** `/cart`
- **Purpose**: List current items in cart.
- **Query Params**: `account_id` or uses location context.

### **DELETE** `/cart/:id`
- **Purpose**: Remove a specific item from cart.

---

## 7.2 Subscriptions
Endpoints for managing recurring billing and service coverage.

### **POST** `/billing/subscriptions`
- **Purpose**: Create a NEW subscription for an account directly.
- **Payload**:
  ```json
  {
    "account_id": "uuid",
    "location_id": "uuid",
    "subscription_type": "MEMBERSHIP_FEE | MEMBERSHIP_JOINING | MEMBERSHIP_RENEWAL | SERVICE",
    "reference_id": "uuid (pricing_id or service_id)",
    "subscription_term_id": "uuid",
    "unit_price_snapshot": 29.99,
    "total_amount": 29.99,
    "billing_period_start": "YYYY-MM-DD",
    "billing_period_end": "YYYY-MM-DD",
    "coverage": [
       { 
         "profile_id": "uuid", 
         "role": "PRIMARY | ADD_ON" 
       }
    ]
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "subscription_id": "uuid",
    "account_id": "uuid",
    "status": "PENDING_PAYMENT",
    "created_at": "timestamp"
  }
  ```

### **PATCH** `/billing/subscriptions/:subscriptionId`
- **Purpose**: Update general subscription fields (Lifecycle, Status, etc).
- **Payload**:
  ```json
  {
    "status": "ACTIVE | PAUSED | CANCELLED",
    "auto_renew": false,
    "staff_id": "uuid"
  }
  ```

### **PATCH** `/billing/subscriptions/:subscriptionId/pricing`
- **Purpose**: Update specific pricing/billing snapshots for an existing subscription.
- **Payload**:
  ```json
  {
    "unit_price_snapshot": 120.00,
    "total_amount": 120.00,
    "next_renewal_date": "2024-04-01"
  }
  ```

### **GET** `/billing/accounts/:accountId/subscriptions`
- **Purpose**: List all subscriptions with coverage details.
- **Response**:
  ```json
  [
    {
      "subscription_id": "uuid",
      "status": "ACTIVE",
      "total_amount": 150.00,
      "billing_period_start": "2024-01-01",
      "billing_period_end": "2024-01-31",
      "coverage": [{ "profile_id": "uuid", "role": "PRIMARY" }]
    }
  ]
  ```

---

## 7.3 Invoicing
Financial records and statement tracking.

### **GET** `/invoices`
- **Purpose**: Paginated search for invoices across the location.
- **Query Params**: 
  - `q`: Search by Invoice #, Member Name, or Email.
  - `startDate` / `endDate`: Filter by creation date (`YYYY-MM-DD`).
  - `page` / `limit`: Pagination control (default: page=1, limit=10).
  - `sortBy`: Field to sort by (default: `created_at`).
  - `sortOrder`: `asc` or `desc` (default: `desc`).
- **Response**:
  ```json
  {
    "total_invoices": 120,
    "total_due_amount": 2500.50,
    "total_found": 45,
    "status_stats": { "PAID": 30, "PENDING": 10, "PARTIAL": 5 },
    "results": [
        {
        "invoice_id": "uuid",
        "invoice_no": 1001,
        "total_amount": 150.00,
        "AmountDue": 50.00,
        "amount_due": 50.00,
        "status": "PARTIAL",
        "primary_profile_name": "John Doe",
        "primary_profile_email": "john@doe.com",
        "created_at": "2024-03-02"
        }
    ]
  }
  ```

### **GET** `/invoices/accounts/:accountId`
- **Purpose**: Fetch all invoices for a specific account.
- **Response**:
  ```json
  [
    {
       "invoice_id": "uuid",
       "invoice_no": 1002,
       "total_amount": 100.00,
       "AmountDue": 0.00,
       "amount_due": 0.00,
       "status": "PAID"
    }
  ]
  ```

### **POST** `/invoices/:id/cancel`
- **Purpose**: Administratively cancel an invoice. Automatically marks related subscriptions as `CANCELLED`.
- **Auth**: Requires Admin/Staff role.
- **Payload** (Optional):
  ```json
  {
    "voidPaymentInGateway": true
  }
  ```
- **Logic**:
  - **PENDING / DRAFT**: Directly marks the invoice and related subscriptions as `CANCELLED`.
  - **PARTIAL / PAID**: If `voidPaymentInGateway` is `true`, it first loops through all `APPROVED` payment transactions for this invoice and voids them via the gateway. It *then* cancels the invoice and subscriptions.
  - **VOID FAILURE**: If any void attempt fails at the gateway, the process **stops immediately** and throws an error. The invoice status and balance remain **unchanged** to prevent data loss (member charged but invoice cancelled).
  - **CANCELLED**: Returns an error (`"Invoice is already cancelled"`).
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Invoice and related subscriptions cancelled successfully."
  }
  ```

---

## 7.4 Payments & Atomic Safe-Charge
These endpoints utilize the **Atomic "Safe-Charge"** pattern for data integrity.

### **POST** `/payments/pay-invoice`
Processes a payment via Cayan and atomically updates DB records.

#### **Request Payload**
```json
{
  "invoiceId": "uuid",
  "accountId": "uuid",
  "amountToBePaid": 150.00,
  "paymentMethodId": "uuid (for saved card)",
  "newCardData": { 
    "cardNumber": "...",
    "expiryMmYy": "MMYY",
    "cardholderName": "...",
    "cvv": "..."
  }
}
```

#### **JSON Error Format (Frontend parsing guide)**
If the payment fails (Status `400` or `500`), the API responds with a JSON object.

**1. Validation or System Error (Before Gateway)**
If the `invoiceId` is invalid, the `paymentMethodId` doesn't exist, or a database error occurs *before* charging:
```json
{
    "error": "invalid or inactive saved payment method"
}
```

**2. Gateway Decline Error (After Gateway Check)**
If the payment actually reaches the gateway but gets declined, the API attaches the raw `gateway` response for deeper debugging:
```json
{
    "error": "Payment processing failed. Status: DECLINED - Transaction declined by gateway",
    "gateway": {
        "status": "DECLINED",
        "errorMessage": "Transaction declined by gateway",
        "rawResponse": "<response>...</response>"
    }
}
```

#### **Specific Error Causes**
| Error Scenario | Example `error` Message | Has `gateway` object? | Frontend Action |
| :--- | :--- | :--- | :--- |
| **Validation Failed** | `"invalid or inactive saved payment method"` | No | User needs to select a valid card. |
| **Card Rejected (400)** | `"Payment processing failed. Status: DECLINED..."` | Yes | Standard bank decline. Show error to user. |
| **System Auto-Void (500)** | `"Payment was authorized but system update failed. The charge has been automatically voided."` | No | **Auto-Void Success**: Money returned automatically. User can retry. |
| **System Critical (500)** | `"...CRITICAL: Failed to void the charge automatically. Please contact support."` | No | **Double Failure**: Both DB sync and Gateway void failed. Customer account was charged but DB not updated. |


### **POST** `/payments/save-card`
- **Purpose**: Vault a credit card for future use.
- **Payload**:
  ```json
  {
    "accountId": "uuid",
    "cardNumber": "0000000000000000",
    "expiryMmYy": "1225",
    "cardholderName": "John Doe",
    "cvv": "123"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "id": "uuid",
    "card_brand": "Visa",
    "last4_digits": "1111",
    "expiry_mm_yy": "1225",
    "is_default": true
  }
  ```

### **GET** `/payments/saved-cards`
- **Purpose**: Fetch all vaulted cards for an account.
- **Query Params**: `account_id=uuid`

### **POST** `/payments/void`
- **Purpose**: Admin-only voiding of an APPROVED transaction to reverse an invoice charge.
- **Payload**:
  ```json
  {
    "transactionId": "uuid",
    "invoiceId": "uuid",
    "accountId": "uuid"
  }
  ```

### **GET** `/payments/transactions/accounts/:accountId`
- **Purpose**: Fetch all payment transactions exclusively for a given account.
- **Response**:
  ```json
  [
    {
      "id": "uuid",
      "amount": 150.00,
      "status": "APPROVED",
      "gateway": "CAYAN",
      "failure_reason": null,
      "card_last4": "1111",
      "approval_code": "..."
    }
  ]
  ```

### **GET** `/payments/transactions`
- **Purpose**: Searchable transaction history across users.
- **Query Params**: 
  - `q`: Search by Status, Approval Code, Gateway Token, or Member Name.
  - `startDate` / `endDate`: Filter by creation date (`YYYY-MM-DD`).
  - `page` / `limit`: Pagination control (default: page=1, limit=10).
  - `sortBy`: Field to sort by (default: `created_at`).
  - `sortOrder`: `asc` or `desc` (default: `desc`).
- **Response**:
  ```json
  {
    "total_transaction_amount": 5000.00,
    "total_found": 85,
    "status_stats": { "APPROVED": 70, "DECLINED": 10, "VOIDED_SYSTEM_ERROR": 2 },
    "results": [
      {
        "id": "uuid",
        "invoice_no": 1001,
        "amount": 150.00,
        "status": "APPROVED",
        "failure_reason": null,
        "card_last4": "1111",
        "approval_code": "..."
      }
    ]
  }
  ```
