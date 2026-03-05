# API: Waivers & Digital Signatures

**Base URL**: `/api/v1`

---

## 8.1 Waiver Requests (Token-based Signing)
Endpoints for generating and processing unique signing links for members.

### **POST** `/waiver-requests`
- **Purpose**: Staff-initiated creation of a digital waiver signing request.
- **Auth**: Requires Admin/Staff role.
- **Payload**:
  ```json
  {
    "account_id": "uuid",
    "profile_id": "uuid",
    "waiver_template_id": "uuid",
    "waiver_type": "REGISTRATION | MEMBERSHIP | SERVICE",
    "expires_in_days": 7,
    "subscription_id": "uuid (optional)",
    "variables": {
       "key": "value"
    }
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "request_id": "uuid",
      "account_id": "uuid",
      "token": "alphanumeric_token",
      "public_signing_url": "https://app.solarswimgym.com/public/sign-waiver?token=...",
      "expires_at": "timestamp"
    }
  }
  ```

### **GET** `/public/waiver-request/:token`
- **Purpose**: Fetch waiver details and template content for a public token.
- **Auth**: None (Public).
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "account_id": "uuid",
      "profile_id": "uuid",
      "waiver_type": "...",
      "location_name": "Location Name",
      "template_content": "HTML/Text content...",
      "resolved_variables": {}
    }
  }
  ```

### **POST** `/public/waiver-request/:token/submit`
- **Purpose**: Submit a signature and complete the waiver.
- **Auth**: None (Public).
- **Payload**:
  ```json
  {
    "signature_base64": "data:image/png;base64,...",
    "final_content": "Full serialized waiver content",
    "agreed": true
  }
  ```
- **Logic**:
  - Creates a `signed_waiver` record.
  - If a `subscription_id` was associated with the token, it automatically links the signed waiver to that subscription.
  - Truncates `MEMBERSHIP_FEE` to `MEMBERSHIP` waiver type for consistency.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "signed_waiver_id": "uuid",
      "account_id": "uuid",
      "profile_id": "uuid"
    }
  }
  ```

---

## 8.2 Waiver Status & Linking
Endpoints for monitoring compliance and manually matching records.

### **GET** `/waivers/status`
- **Purpose**: Get a consolidated list of pending and signed waivers for an account or profile.
- **Query Params**:
  - `account_id` (Required)
  - `profile_id` (Optional)
  - `status` (Optional): `pending` | `signed`. If not provided, returns both.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "pending": [
        {
          "type": "REGISTRATION",
          "profile_id": "uuid",
          "profile_name": "John Doe"
        },
        {
          "type": "MEMBERSHIP",
          "subscription_id": "uuid",
          "reference_id": "uuid",
          "created_at": "timestamp"
        }
      ],
      "signed": [
        {
          "type": "SERVICE",
          "subscription_id": "uuid",
          "signedwaiver_id": "uuid"
        }
      ]
    }
  }
  ```

### **PATCH** `/subscriptions/:subscriptionId/waiver`
- **Purpose**: Manually link a specific signed waiver to a subscription.
- **Payload**:
  ```json
  {
    "signedwaiver_id": "uuid"
  }
  ```
- **Response**: Returns the updated subscription object.

### **GET** `/signed-waivers/:signedWaiverId`
- **Purpose**: Fetch a single signed waiver by its ID, including linked subscription details.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "signed_waiver_id": "uuid",
      "profile_id": "uuid",
      "waiver_type": "MEMBERSHIP",
      "content": "...",
      "signature_url": "...",
      "subscription": {
        "subscription_id": "uuid",
        "status": "ACTIVE"
      }
    }
  }
  ```

### **GET** `/signed-waivers` (Enhanced)
- **Purpose**: List signed waivers with optional subscription details.
- **Response**: Includes `subscription` object if linked.
  ```json
  [
    {
      "signed_waiver_id": "uuid",
      "waiver_type": "MEMBERSHIP",
      "subscription": {
        "subscription_id": "uuid",
        "status": "ACTIVE",
        "total_amount": 150.00
      }
    }
  ]
  ```
