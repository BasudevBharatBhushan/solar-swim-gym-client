# Service Documentation (Frontend)

This document provides taking an overview of the frontend Service Layer located in `src/services/`. The Service Layer abstracts all direct HTTP communication (`axios`, `fetch`) and backend API endpoints behind typed, reusable TypeScript functions.

---

## 1. Core API Configuration

### `apiClient.ts`
- **Purpose**: The centralized Axios instance configuration (`apiClient`).
- **Features**: 
  - Attached interceptors to handle appending `Authorization: Bearer <token>` to request headers.
  - Interceptors to inject the `location_id` into the payload or query parameters based on Context.
  - Global error handling for network errors or specific API error responses (e.g., `401 Unauthorized`).

---

## 2. Authentication & Session

### `authService.ts`
- **Purpose**: Manage authentication flows for Staff and Users (Onboarding).
- **Key Methods**: 
  - `staffLogin(credentials)`: Authenticate admins.
  - `userLogin(credentials)`: Authenticate standard members.
  - `userRegister(payload)`: Sign up a new account or primary profile.

### `sessionService.ts`
- **Purpose**: Utilities to read, clear, and manage session/JWT tokens from local storage or memory.

---

## 3. CRM & Accounts (Leads & Members)

### `crmService.ts`
- **Purpose**: Handles Pre-Sales Leads management.
- **Key Methods**:
  - `fetchLeads()`: List leads.
  - `upsertLead(leadData)`: Create or update lead information.
  - `searchLeads(query)`: Query leads from indexing service.

### `accountService.ts`
- **Purpose**: Manage enrolled Account entities, including linking primary and family profiles.
- **Key Methods**:
  - `fetchAccounts()`: List active member accounts.
  - `upsertAccount(payload)`: Full/Bulk update of a family roster under an account.

### `staffService.ts`
- **Purpose**: Interactivity with the backend staff configurations.
- **Key Methods**:
  - `fetchStaff()`: List location-scoped staff members.
  - `upsertStaff(payload)`: Add or update a staff member's role and details.

---

## 4. Configuration & Reference Data

### `configService.ts`
- **Purpose**: Configuration endpoints largely managed by `SUPERADMIN`.
- **Key Methods**:
  - `fetchLocations()`: List available facility locations.

### `dropdownService.ts`
- **Purpose**: Fetch reference list items (for UI Select/Dropdown inputs).
- **Key Target Areas**: `age-groups`, `subscription-terms`, `waiver-programs`.

---

## 5. Sales & Services Catalog

### `serviceCatalog.ts`
- **Purpose**: Interacts with the backend `/services` APIs.
- **Key Methods**:
  - `fetchServices()`: Grabs the full service/pricing matrix nested by term and age group.
  - `upsertService(serviceData)`: Modify or define a new catalog service.

### `basePriceService.ts`
- **Purpose**: Handling the standard flat-rate pricing applied before memberships.

### `pricingService.ts`
- **Purpose**: Contains local frontend utility calculations to parse nested pricing rules and generate final UI pricing values before checkout.

### `membershipService.ts`
- **Purpose**: Management of the nested club memberships, including discounts, fees, and rules.
- **Key Methods**:
  - `fetchMemberships()`: Pulls all tiered membership records.
  - `upsertMembership(program)`: Complex payload generation for nested club benefits.

### `discountService.ts`
- **Purpose**: Handles promo code operations (`/discounts`).
- **Key Methods**:
  - `validateCode(code)`: Checks if a code is valid for checkout.

---

## 6. Checkout, Invoicing & Billing

### `cartService.ts`
- **Purpose**: Local utility service combining pricing logic to construct a checkout cart payload before finalizing a subscription.

### `billingService.ts`
- **Purpose**: Connects with `/billing/subscriptions` and global invoicing logic.
- **Key Methods**:
  - `createSubscription(payload)`: Creates recurring billing charges from the final cart payload.
  - `fetchAccountSubscriptions(accountId)`: List active bills for an individual.

### `paymentService.ts`
- **Purpose**: Handles charging functions, primarily related to `/payments` routing.
- **Key Methods**:
  - `payInvoice(payload)`: Submits partial or full payment for an outstanding ledger balance.

---

## 7. Documents & Communications

### `waiverService.ts`
- **Purpose**: Handles interaction regarding electronic documents and templates.
- **Key Methods**:
  - Document fetching, variable compilation prior to showing in the `ContractsSigningDialog`.

### `emailService.ts`
- **Purpose**: Fires direct requests to server to dispatch manual or template-based communications to user profiles.

### `emailConfigService.ts`
- **Purpose**: Used for Location-based SMTP backend configuration.
