# Payment Refunds & Voids API

This document details the APIs for voiding and refunding transactions via the internal payment gateway (Merchantware v4). These operations modify existing `payment_transactions` and reflect adjustments on the connected `invoice`.

**Base Path:** `/api/v1/payment`

---

## 1. Void a Transaction

Voids a previously authorized and approved transaction.

*   **URL:** `/void`
*   **Method:** `POST`
*   **Auth Required:** Yes (Admin/Staff only)

### Request Payload (JSON)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `transactionId` | `string` | **Yes** | The internal UUID of the existing `payment_transactions` record to void. |
| `invoiceId` | `string` | **Yes** | The ID of the invoice associated with the transaction. |
| `accountId` | `string` | **Yes** | The ID of the account. |

**Example Request:**
```json
{
  "transactionId": "txn_uuid_12345",
  "invoiceId": "inv_uuid_67890",
  "accountId": "acc_uuid_11223"
}
```

### Response

**Success (200 OK):**
Returns the newly created void transaction record from the database.

```json
{
  "id": "void_txn_uuid_abcde",
  "invoice_id": "inv_uuid_67890",
  "account_id": "acc_uuid_11223",
  "amount": 100.50,
  "status": "VOIDED",
  "gateway": "CAYAN",
  "gateway_transaction_token": "TOKEN_STRING",
  "approval_code": "APP_123",
  ...
}
```

**Errors:**
*   **400 Bad Request:** Missing required fields, or the original transaction was not found/already voided.
*   **401 Unauthorized / 403 Forbidden:** User lacks the necessary privileges.
*   **500 Internal Server Error:** Gateway or database error.

---

## 2. Refund a Transaction

Issues a full or partial refund for a previously captured transaction.

*   **URL:** `/refund`
*   **Method:** `POST`
*   **Auth Required:** Yes (Admin/Staff only)

### Request Payload (JSON)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `transactionId` | `string` | **Yes** | The internal UUID of the existing `payment_transactions` record to refund. |
| `invoiceId` | `string` | **Yes** | The ID of the invoice associated with the transaction. |
| `accountId` | `string` | **Yes** | The ID of the account. |
| `refundAmount` | `number` | **No** | The amount to refund. If omitted, it defaults to the full amount of the original transaction. |

**Example Request (Partial Refund):**
```json
{
  "transactionId": "txn_uuid_12345",
  "invoiceId": "inv_uuid_67890",
  "accountId": "acc_uuid_11223",
  "refundAmount": 50.00
}
```

### Response

**Success (200 OK):**
Returns the newly created refund transaction record. If the refunded amount equals or exceeds the original transaction amount, the original transaction's status is also updated to `REFUNDED`.

```json
{
  "id": "refund_txn_uuid_wxyz",
  "invoice_id": "inv_uuid_67890",
  "account_id": "acc_uuid_11223",
  "amount": 50.00,
  "status": "REFUNDED",
  "gateway": "CAYAN",
  "gateway_transaction_token": "TOKEN_STRING",
  "approval_code": "APP_456",
  ...
}
```

**Errors:**
*   **400 Bad Request:** Missing required fields, or the original transaction was not found.
*   **401 Unauthorized / 403 Forbidden:** User lacks the necessary privileges.
*   **500 Internal Server Error:** Gateway or database error.

---

## Business Logic Notes

*   **Invoices Reverting:** Both the Void and Refund operations recalculate and update the corresponding `invoice`. The `AmountDue` is incremented by the voided/refunded amount, and the invoice status may revert to `PARTIAL` or `UNPAID` depending on the remaining balance.
*   **Underlying Gateway:** Transactions interact with the Cayan/Merchantware `/v4/Credit.asmx` API in the background. The gateway receives explicit `merchantTransactionId` values to preserve exact trace lineage.
*   **Token Continuity:** These endpoints require the original transaction to have a valid `gateway_transaction_token`, indicating it was successfully processed. If the token is missing, the operation will be denied.
