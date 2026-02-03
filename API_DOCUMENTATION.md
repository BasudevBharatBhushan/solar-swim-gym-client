# Solar Swim Gym — API Route Documentation

This document defines the backend API contracts, logic, and pseudo-code implementations.
**Base URL**: `/api/v1`
**Authentication**: All protected routes require `Authorization: Bearer <token>` header.

---

## 1. Authentication & Context

### 1.1 Staff Authentication
**POST** `/auth/staff/login`
- **Purpose**: Authenticate admin/staff members.
- **Payload**: `{ "email": "admin@solar.com", "password": "..." }`
- **Logic**:
  1. Find staff by email in `staff` table.
  2. Verify password hash.
  3. Generate JWT (`staff_id`, `role`, `location_id` (if not superadmin)).
- **Response**: `{ "token": "...", "user": { ... } }`

### 1.2 Account/User Registration & Activation
**POST** `/auth/user/register`
- **Purpose**: Register a new account with family members.
- **Payload**: 
  ```json
  {
    "location_id": "uuid",
    "primary_profile": { 
        "first_name": "...", 
        "waiver_program_id": "...", 
        "case_manager_name": "..." 
    },
    "family_members": [ 
        { "first_name": "...", "waiver_program_id": "..." } 
    ]
  }
  ```
- **Logic**: Creates Account, Profiles (linked, email for primary). Waiver info is now per-profile.

**GET** `/auth/user/activate`
- **Purpose**: Validate activation token before prompting for password.
- **Query Params**: `token=...`
- **Response**: `{ "success": true, "message": "...", "account": { "account_id": "...", "email": "..." } }`

**POST** `/auth/user/activate`
- **Purpose**: Set password for the primary profile and activate account.
- **Payload**: `{ "token": "...", "password": "..." }`
- **Logic**: Validates token again, hashes password for primary profile, sets account status to `ACTIVE`, and marks token as used.

**POST** `/auth/user/login`
- **Purpose**: Authenticate end-users.
- **Payload**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "token": "...", "user": { ... } }`
- **JWT Claims**: `profile_id`, `account_id`, `location_id`, `type: 'user'`.

### 1.3 Session Context (Location)
*Note: For Staff, `location_id` is often embedded in the token. For Superadmins managing multiple locations, they may need to switch context.*

**POST** `/auth/switch-location`
- **Header**: Superadmin Token
- **Payload**: `{ "location_id": "uuid" }`
- **Logic**:
  1. Verify user is SUPERADMIN.
  2. Generate new JWT with updated `location_id`.
- **Response**: `{ "token": "..." }`

---

## 2. Core Configuration (Admin)

### 2.1 Locations
**GET** `/locations` (Superadmin only)
**POST** `/locations` (Superadmin only)
- **Purpose**: Create or Update a Location.
- **Payload**: `{ "id": "optional-uuid", "name": "...", "address": "..." }`
- **Logic**: If `id` is present, Update; otherwise Create.

### 2.2 Staff Management
**GET** `/staff`
- **Filter**: By `location_id` (from session).
**POST** `/staff`
- **Purpose**: Create or Update Staff.
- **Payload**: `{ "staff_id": "optional-uuid", "first_name", "last_name", "email", "password", "role", "location_id" }`
- **Logic**: If `staff_id` is present, Update; otherwise Create.

---

## 3. Reference Data
*Scope: Location Based*

### 3.1 Age Groups
**GET** `/config/age-groups`
- **Response**: List of `age_group`.
**POST** `/config/age-groups`
- **Purpose**: Create or Update Age Group.
- **Payload**: `{ "age_group_id": "optional-uuid", "name": "Adult", "min_age": 18, "max_age": 64 }`
- **Logic**: Upsert based on `age_group_id`.

### 3.2 Subscription Terms
**GET** `/config/subscription-terms`
- **Response**: List of `subscription_term` (e.g., Monthly, 3-Month).
**POST** `/config/subscription-terms`
- **Purpose**: Create or Update Subscription Term.
- **Payload**: `{ "subscription_term_id": "optional-uuid", ... }`
- **Logic**: Upsert based on `subscription_term_id`.

### 3.3 Waiver Programs
**GET** `/config/waiver-programs`
- **Response**: List of `waiver_program` (e.g., RCBE).
**POST** `/config/waiver-programs`
- **Purpose**: Create or Update Waiver Program.
- **Payload**: `{ "waiver_program_id": "optional-uuid", "name",  "code", "requires_case_manager", "is_active", ... }`
- **Logic**: Upsert based on `waiver_program_id`.

---

## 4. Service Catalog & Pricing

### 4.1 Services
**GET** `/services`
- **Purpose**: Fetch all services including their full pricing structure.
- **Response Structure**:
  ```json
  [
    {
      "service_id": "uuid",
      "service_name": "Swimming Lesson",
      "pricing_structure": [
          {
            "age_group_id": "...",
            "age_group_name": "Junior",
            "terms": [
               { "subscription_term_id": "...", "term_name": "Monthly", "price": 20.00, "price_id": "..." },
               { "subscription_term_id": "...", "term_name": "Yearly", "price": 200.00, "price_id": "..." }
            ]
          },
          // ... more age groups
      ]
    }
  ]
  ```
- **Note**: This nested structure groups prices by Age Group, making it easy for the frontend to render tabular rows (Age Group vs Terms) without hardcoded "matrix" fields.

**POST** `/services`
- **Purpose**: Create or Update Service and its Pricing.
- **Payload**: 
  ```json
  {
    "service_id": "optional-uuid",
    "name": "Service Name",
    "pricing_structure": [ ... ]
  }
  ```
- **Backend Logic (Pseudo-code)**:
  ```javascript
  transaction {
    if (input.service_id) {
       Update Service Details;
    } else {
       Create New Service;
    }
    
    for each group (AgeGroup) in pricing_structure:
      for each term_item in group.terms:
         
         const priceData = { ...term_item.price };
         // Upsert logic for Base/Service Price
         upsert price where 
            service_id = current.service_id 
            AND age_group = group.id 
            AND term = term_item.id
  }
  ```

## 5. Membership Engine

### 5.1 Fetch Membership Configuration
**GET** `/memberships/matrix`
- **Purpose**: Fetch full hierarchy in a structured format.
- **Response**:
  ```json
  {
    "programs": [
      {
        "id": "...", "name": "Gold Club",
        "categories": [
           { 
             "id": "...", "name": "Family",
             "fees": [ { "type": "JOINING", "amount": 100 } ],
             "rules": [ { "condition": "min_members: 3", "result": "ALLOW" } ],
             "bundled_services": [ 
                { "service_id": "...", "is_included": true, "discount": "20%", "usage_limit": "10 visits" } 
             ]
           }
        ]
      }
    ]
  }
  ```

### 5.2 Configure Membership (Batch Upsert)
**POST** `/memberships/configuration`
- **Purpose**: Create or Update the entire membership structure for a program.
- **Payload**: Matches the response structure of `GET`.
- **Backend Logic**:
  ```javascript
  transaction {
     upsert MembershipProgram
     for each Category:
        upsert MembershipProgramCategory
        
        // Sync Fees
        delete fees where category_id = ... AND id NOT IN input.fee_ids
        upsert fees
        
        // Sync Rules
        delete rules where category_id = ... AND id NOT IN input.rule_ids
        upsert rules
        
        // Sync Services
        delete membership_service where category_id = ... AND id NOT IN input.service_ids
        upsert membership_service
  }
  ```

---

## 6. CRM (Leads, Accounts, Profiles)

### 6.1 Leads
**GET** `/leads`
- **Purpose**: Basic list from DB (recent 50).
**GET** `/leads/search`
- **Purpose**: Elasticsearch query.
- **Query Params**: `q=name`, `status=NEW`.
- **Action**: Query Elastic index `leads`.
**POST** `/leads`
- **Purpose**: Create or Update Lead.
- **Payload**: `{ "lead_id": "optional-uuid", ... }`
- **Logic**: If `lead_id` present -> Update, else -> Create.
**POST** `/leads/reindex`
- **Purpose**: Rebuild Elasticsearch index for leads.
- **Access**: Admin.

### 6.2 Accounts & Profiles
**GET** `/accounts`
- **Purpose**: List accounts (DB Paginated).
- **Access**: Controlled by isolation.
**GET** `/accounts/search`
- **Purpose**: Elasticsearch query for accounts/profiles.
**GET** `/accounts/:id` (Coming Soon)
- **Purpose**: Full Account Detail View.
**POST** `/accounts/upsert` (**Staff/Admin Operation**)
- **Purpose**: Manual modification of Profiles within an existing Account.
- **Payload**:
  ```json
  {
    "account_id": "uuid (REQUIRED)",
    "location_id": "...",
    "primary_profile": { "profile_id": "optional-uuid", ..., "waiver_program_id": "..." },
    "family_members": [ { "profile_id": "optional-uuid", ..., "waiver_program_id": "..." } ]
  }
  ```
- **Logic**: 
  - REQUIRES `account_id`. Does NOT create new accounts (use `/auth/user/register` for new accounts).
  - For each profile in payload: If `profile_id` is present, Updates; otherwise Creates a new profile linked to the `account_id`.

### 6.3 Global Indexing
**POST** `/cron/reindex-all`
- **Purpose**: Rebuild Elastic indices for Leads, Accounts, Profiles.
- **Security**: Protected (Admin/Cron Key).

---

## 7. Billing & Subscriptions

### 7.1 Subscriptions
**POST** `/billing/subscriptions`
- **Purpose**: Create a NEW subscription.
- **Payload**:
  ```json
  {
    "account_id": "...",
    "location_id": "...",
    "subscription_type": "BASE / MEMBERSHIP_FEE / ADDON_SERVICE",
    "reference_id": "id (price_id, term_id, etc.)",
    "subscription_term_id": "...",
    "unit_price_snapshot": 29.99,
    "total_amount": 29.99,
    "billing_period_start": "YYYY-MM-DD",
    "billing_period_end": "YYYY-MM-DD",
    "coverage": [
       { "profile_id": "...", "role": "PRIMARY / ADD_ON" }
    ]
  }
  ```
- **Logic**: Creates a `subscription` record and associated `subscription_coverage` links.

**GET** `/billing/accounts/:accountId/subscriptions`
- **Purpose**: List all subscriptions (with coverage details) for a specific account.
- **Required**: `accountId` in URL.
- **Response**: List of subscriptions including nested coverage and profile details.

### 7.2 Invoices & Payments
**GET** `/invoices/:id`
**POST** `/payments`
- **Payload**: `{ "invoice_id": "...", "amount": 100.00, "method": "CASH/CARD", "ref": "..." }`
- **Logic**:
  1. Record payment.
  2. Update Invoice status.
  3. If Invoice PAID, activate associated Subscriptions (set status ACTIVE).

### 7.3 Waiver Programs
**GET** `/waivers`
**POST** `/waivers`

---

## 8. Discounts & Promotions

### 8.1 Discount Codes
**GET** `/discounts`
- **Purpose**: Fetch all discount codes for the current location.
- **Access**: Staff/Admin.
- **Response**: List of `discount_codes`.

**POST** `/discounts`
- **Purpose**: Create or Update a discount code.
- **Access**: Admin.
- **Payload**:
  ```json
  {
    "discount_id": "optional-uuid",
    "discount_code": "WINTER6",
    "discount": "6% / 6",
    "staff_name": "...",
    "is_active": true
  }
  ```
- **Logic**: Upsert based on `discount_id`. Uses `location_id` from session context.

**GET** `/discounts/validate/:code`
- **Purpose**: Validate a code and return its value if valid and active.
- **Access**: Authenticated.
- **Logic**: Search by `code` and `location_id`.
