
## Account List → Account Detail → Profile → Subscription Flow

### (With Mandatory Service-Layer Validation Before UI Implementation)

### Tech Stack Context

Frontend must be implemented using:

* Vite + React
* Material UI for UI components
* Tailwind (optional) for layout/utility styling

All API calls must:

* Use `Authorization: Bearer <token>`
* Be scoped by `x-location-id`

---

## 0. Mandatory Pre-Implementation Step (Critical Instruction)

Before proceeding with any further frontend implementation:

* Validate all service-layer APIs **by executing test calls internally** (service mocks / API client calls) to confirm:

  * Request shapes
  * Response structure
  * Field names
  * Nested objects
  * Pagination format
  * Error cases

* Do NOT assume response shapes.

* Manual testing (Postman/curl) is the **final verification step**, not the first.

* If any mismatch is found between assumed contracts and actual API responses, revise the frontend data models and integration logic accordingly before building UI flows.

The AI must revisit and correct any previously assumed response models to align with the real API responses shown below.

---

## 1. Accounts List Page (Sidebar → Accounts)

### API (Search Accounts)

```
GET /api/v1/accounts/search
Headers:
- x-location-id: 490f7013-a95d-4664-b750-1ecbb98bd463
- Authorization: Bearer <token>
```

### Real Response Shape (Authoritative Contract)

```json
{
  "total": 1,
  "results": [
    {
      "account_id": "uuid",
      "location_id": "uuid",
      "status": "PENDING",
      "created_at": "timestamp",
      "profiles": [
        {
          "profile_id": "uuid",
          "first_name": "string",
          "last_name": "string",
          "email": "string"
        }
      ]
    }
  ]
}
```

### UI Requirements

* Render account rows using `results[]`
* Display:

  * Account status
  * Created date
  * Primary profile name (derive from `profiles[0]` or mark primary explicitly if API provides later)
  * Total number of profiles
* Implement:

  * Search (`q`)
  * Pagination (`from`, `size`)
  * Sorting (`sort`, `order`)
* Clicking an account row navigates to:

  * `/accounts/:accountId`

---

## 2. Account Detail Page (After Clicking an Account)

### Data Loading

* Use the selected `account_id` from the search result
* Use embedded `profiles[]` from the account search response to render the left-side profile list immediately
* Do NOT refetch profiles list unless necessary

### Layout

**Two-Column Layout**

**Left Panel**

* Profile list rendered from:

  * `account.results[].profiles[]`
* Each profile item must store:

  * `profile_id`
  * `first_name`, `last_name`, `email`

**Right Panel**

* Tabs:

  * Profile Details
  * Subscriptions

---

## 3. Profile Detail (Right Panel → Profile Details Tab)

### API (Fetch Profile Detail)

```
GET /api/v1/profiles/{profile_id}
Headers:
- x-location-id
- Authorization
```

### Real Response Shape (Authoritative Contract)

```json
{
  "profile_id": "uuid",
  "first_name": "Debasis",
  "last_name": "Pradha",
  "email": "d@b.com",
  "waiver_program": {
    "code": "RCEB",
    "name": "Regional Center of the East Bay (RCEB)"
  }
}
```

### UI Requirements

* Fetch full profile detail when a profile is clicked
* Render:

  * Name
  * Email
  * Waiver program details (if present)
* Do not assume guardian/emergency fields exist unless returned by API
* Gracefully handle optional fields

---

## 4. Subscriptions Tab (Per Profile Context)

### Data Loading

* Fetch subscriptions at account level:

  ```
  GET /api/v1/billing/accounts/{accountId}/subscriptions
  ```
* Then map subscriptions to profiles using `subscription_coverage`

### UI Requirements

* Show:

  * Subscription type (BASE / MEMBERSHIP_FEE / ADDON_SERVICE)
  * Plan/service name (resolved from `reference_id`)
  * Billing period
  * Status
  * Covered profiles:

    * Display profile name + role (PRIMARY / ADD_ON)
* When a profile is selected in left panel:

  * Filter or highlight only those subscriptions whose `subscription_coverage` contains the selected `profile_id`

---

## 5. Create Subscription Flow (From Subscriptions Tab)

### Marketplace Page (Read-Only Selection)

* Render:

  * Services + Service Packs
  * Membership Programs + Categories
  * Base Pricing
* No default selections
* No editing
* Explicit selection required

---

## 6. Subscription Creation (Data Contract Enforcement)

### Critical Data Model Rules

* `subscription.reference_id` is polymorphic and may reference:

  * `base_price_id`
  * `membership_program_category_id`
  * `service_id`
  * `service_pack_id`

* `profile_id` MUST NOT be placed on `subscription`

* Profile mapping MUST be done via `subscription_coverage`

### API

```
POST /api/v1/billing/subscriptions
```

### Payload Contract

```json
{
  "account_id": "uuid",
  "location_id": "uuid",
  "subscription_type": "BASE | MEMBERSHIP_FEE | ADDON_SERVICE",
  "reference_id": "uuid",
  "subscription_term_id": "uuid",
  "unit_price_snapshot": 29.99,
  "total_amount": 29.99,
  "billing_period_start": "YYYY-MM-DD",
  "billing_period_end": "YYYY-MM-DD",
  "coverage": [
    {
      "profile_id": "uuid",
      "role": "PRIMARY",
      "exempt": false,
      "exempt_reason": ""
    }
  ]
}
```

Each selected item must create a **separate subscription row** with its own `coverage` entry.

---

## 7. Authentication & Environment Context (Hard Constraints)

For development/testing:

* Login:

  * `priya@kibizsystems.com`
  * `123456`
* Use location:

  * `x-location-id: 490f7013-a95d-4664-b750-1ecbb98bd463`

---

## 8. Implementation Order (Strict)

1. Validate APIs via service-layer test calls
2. Implement Accounts List (search, pagination, reindex)
3. Implement Account Detail page
4. Implement Profile Details fetch
5. Implement Subscriptions view with coverage mapping
6. Implement Marketplace selection
7. Implement Subscription creation
8. Re-verify end-to-end flow with real API responses


