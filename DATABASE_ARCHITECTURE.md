# Solar Swim Gym — Database Architecture & Schema Reference

This document provides a comprehensive detailed reference of the database schema, including all tables, columns, data types, relationships, and security policies.

## **System Architecture Overview**

*   **Database Engine**: PostgreSQL (via Supabase)
*   **Security**: Row-Level Security (RLS) policies are applied to nearly all tables using `location_id` as the isolation root.
*   **Extensions**: `uuid-ossp` (UUID generation), `pgcrypto` (Hashing/Encryption).

---

## **1. Core Infrastructure**

### **Table: `location`**
The root entity for the multi-tenant architecture. Every business unit is a location.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `location_id` | `UUID` | Unique identifier for the location. | **PK**, Default: `gen_random_uuid()` |
| `name` | `TEXT` | Display name of the location (e.g., "Downtown Branch"). | `NOT NULL` |
| `address` | `TEXT` | Physical address of the location. | |
| `city` | `TEXT` | City. | |
| `state` | `TEXT` | State. | |
| `zip_code` | `TEXT` | Zip Code. | |
| `phone` | `TEXT` | Phone number. | |
| `email` | `TEXT` | Email address. | |
| `timezone` | `TEXT` | Timezone. | |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |
| `updated_at` | `TIMESTAMP` | Record update timestamp. | Default: `NOW()` |

**RLS Policy**: Enabled.

---

## **2. Identity & Access Management**

### **Table: `staff`**
Administrative users who manage the system.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `staff_id` | `UUID` | Unique identifier for the staff member. | **PK**, Default: `gen_random_uuid()` |
| `location_id` | `UUID` | The location this staff belongs to. Nullable for Superadmins. | **FK** -> `location` |
| `first_name` | `TEXT` | Staff first name. | `NOT NULL` |
| `last_name` | `TEXT` | Staff last name. | `NOT NULL` |
| `email` | `TEXT` | Login email address. | `UNIQUE`, `NOT NULL` |
| `password_hash` | `TEXT` | Securely hashed password. | |
| `role` | `ENUM` | `SUPERADMIN`, `ADMIN`, `STAFF` | Default: `STAFF` |
| `is_active` | `BOOLEAN` | If false, staff cannot log in. | Default: `TRUE` |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |

**RLS Policy**: Superadmins view all. Admins/Staff view only their `location_id`.

### **Table: `account`**
The billing entity. Represents a household or paying unit.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `account_id` | `UUID` | Unique billing account ID. | **PK**, Default: `gen_random_uuid()` |
| `location_id` | `UUID` | The location this account belongs to. | **FK** -> `location`, `NOT NULL` |
| `status` | `ENUM` | `PENDING`, `ACTIVE`, `SUSPENDED` | Default: `PENDING`, `NOT NULL` |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |

**RLS Policy**: Users match `app.current_location_id`.

### **Table: `profile`**
Individuals (members) attached to an account.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `profile_id` | `UUID` | Unique member ID. | **PK**, Default: `gen_random_uuid()` |
| `account_id` | `UUID` | The billing account this person belongs to. | **FK** -> `account`, `NOT NULL` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `NOT NULL` |
| `first_name` | `TEXT` | First name. | `NOT NULL` |
| `last_name` | `TEXT` | Last name. | `NOT NULL` |
| `date_of_birth` | `DATE` | DOB used for age group calculation. | `NOT NULL` |
| `email` | `TEXT` | Login email (required for Primary). | |
| `password` | `TEXT` | Hashed password. | |
| `is_primary` | `BOOLEAN` | True if this is the main account holder. | Default: `FALSE` |
| `is_active` | `BOOLEAN` | Soft delete flag. | Default: `TRUE` |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |
| **Minor / Emergency** | | | |
| `guardian_name` | `TEXT` | Legal guardian (for minors). | |
| `guardian_mobile` | `TEXT` | Guardian contact (for minors). | |
| `emergency_contact_name` | `TEXT` | Emergency contact name. | |
| `emergency_contact_phone`| `TEXT` | Emergency contact phone. | |
| **Waiver / Funding** | | | |
| `waiver_program_id` | `UUID` | Linked funding program (e.g., RCBE). | **FK** -> `waiver_program` |
| `case_manager_name` | `TEXT` | Case manager name for funding. | |
| `case_manager_email` | `TEXT` | Case manager email for funding. | |

**RLS Policy**: Filter by `location_id`.

### **Table: `waiver_program`**
Government or third-party funding programs (e.g., RCBE).

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `waiver_program_id` | `UUID` | Unique identifier. | **PK**, Default: `gen_random_uuid()` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `NOT NULL` |
| `name` | `TEXT` | Program name. | `NOT NULL` |
| `description` | `TEXT` | Details. | |
| `code` | `TEXT` | Internal/External reference code. | |
| `requires_case_manager`| `BOOLEAN` | If true, user must provide CM info. | Default: `FALSE` |
| `is_active` | `BOOLEAN` | Availability flag. | Default: `TRUE` |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |

**RLS Policy**: Filter by `location_id`.

### **Table: `account_activation_tokens`**
Temporary tokens for email verification and password setup.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `token_id` | `UUID` | Primary Key. | **PK**, Default: `gen_random_uuid()` |
| `account_id` | `UUID` | The account being activated. | **FK** -> `account`, Nullable |
| `staff_id` | `UUID` | The staff account being activated/reset. | **FK** -> `staff`, Nullable |
| `is_staff` | `BOOLEAN` | True if this token is for a staff member. | Default: `FALSE` |
| `token` | `UUID` | The secret token sent to the user/staff. | Default: `gen_random_uuid()`, `NOT NULL` |
| `expires_at` | `TIMESTAMP`| Expiration time (usually 24h). | `NOT NULL` |
| `is_used` | `BOOLEAN` | Flag to prevent reuse. | Default: `FALSE` |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |

**RLS Policy**: Inherited via Account -> Location.

---

## **3. Leads & Pre-Sales**

### **Table: `leads`**
Potential customers tracked before converting to Accounts.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `lead_id` | `UUID` | Unique identifier. | **PK**, Default: `gen_random_uuid()` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `NOT NULL` |
| `first_name` | `TEXT` | Lead first name. | `NOT NULL` |
| `last_name` | `TEXT` | Lead last name. | `NOT NULL` |
| `email` | `TEXT` | Contact email. | |
| `mobile` | `TEXT` | Contact mobile. | |
| `status` | `ENUM` | `NEW`, `CONTACTED`, `CONVERTED`, `ARCHIVED` | Default: `NEW`, `NOT NULL` |
| `added_by_staff_id` | `UUID` | Staff member who created the lead. | **FK** -> `staff` |
| `added_by_staff_name` | `TEXT` | Snapshot of staff name at creation. | |
| `notes` | `TEXT` | Internal notes. | |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |

**RLS Policy**: Filter by `location_id`.

---

## **4. Services & Pricing**

### **Table: `service`**
The catalog of available offerings.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `service_id` | `UUID` | Unique service ID. | **PK**, Default: `gen_random_uuid()` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `NOT NULL` |
| `name` | `TEXT` | Service name (e.g., "Swimming Lesson").| `NOT NULL` |
| `description` | `TEXT` | Description of the service. | |
| `is_addon_only` | `BOOLEAN` | If true, cannot be sold as a primary plan.| Default: `FALSE` |
| `is_active` | `BOOLEAN` | Availability flag. | Default: `TRUE` |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |
| `type` | `TEXT` | e.g., "Private", "Group". | |
| `service_type` | `TEXT` | e.g., "SELF", "TRAINING". | |
| `image_url` | `TEXT` | Public URL of the uploaded image. | |
| `LessonRegistrationFee` | `DECIMAL` | Registration fee for classes/lessons. | Default: `0.00` |

**RLS Policy**: Filter by `location_id`.

### **Table: `service_pack`**
Bundles of classes or time-based access linked to a service.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `service_pack_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `service_id` | `UUID` | Parent service. | **FK** -> `service`, `NOT NULL` |
| `name` | `TEXT` | Pack name (e.g., "10 Class Pack"). | `NOT NULL` |
| `description` | `TEXT` | Details. | |
| `classes` | `INT` | Number of classes included. | |
| `duration_days` | `INT` | Validity in days. | |
| `duration_months` | `INT` | Validity in months. | |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |
| `updated_at` | `TIMESTAMP` | Record update timestamp. | Default: `NOW()` |
| `is_waiver_free_allowed` | `BOOLEAN` | If true, pack can be offered free under state waiver programs. | Default: `FALSE` |


### **Table: `email_smtp_config`**
Configuration for sending emails via SMTP per location.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `config_id` | `UUID` | Unique configuration ID. | **PK**, Default: `gen_random_uuid()` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `UNIQUE`, `NOT NULL` |
| `smtp_host` | `TEXT` | SMTP Server Host (e.g., smtp.gmail.com). | |
| `smtp_port` | `INTEGER` | SMTP Port (e.g., 587). | |
| `sender_email` | `TEXT` | From email address. | |
| `sender_name` | `TEXT` | From name. | |
| `smtp_username` | `TEXT` | Username for authentication. | |
| `smtp_password` | `TEXT` | Password for authentication. | |
| `is_secure` | `BOOLEAN` | Use TLS/SSL. | Default: `TRUE` |
| `is_active` | `BOOLEAN` | Availability flag. | Default: `TRUE` |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |
| `updated_at` | `TIMESTAMP` | Record update timestamp. | Default: `NOW()` |

**RLS Policy**: Filter by `location_id`. Only accessible by authorized staff.

### **Table: `base_price`**
Standard pricing for core services.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `base_price_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `NOT NULL` |
| `name` | `TEXT` | Name of the pricing tier. | `NOT NULL` |
| `role` | `ENUM` | `PRIMARY`, `ADD_ON` | Default: `PRIMARY`, `NOT NULL` |
| `age_group_id` | `UUID` | Target age group (Reference). | **FK** -> `age_group`, `NOT NULL` |
| `subscription_term_id`| `UUID` | Billing cycle (Reference). | **FK** -> `subscription_term`, `NOT NULL` |
| `price` | `DECIMAL` | The cost amount. | `NOT NULL`, Default: `0.00` |
| `is_active` | `BOOLEAN` | Availability flag. | Default: `TRUE` |

**RLS Policy**: Filter by `location_id`.

### **Table: `service_price`**
Pricing for service packs.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `service_price_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `service_pack_id` | `UUID` | The pack being priced. | **FK** -> `service_pack`, `NOT NULL` |
| `service_id` | `UUID` | Legacy reference (Nullable). | **FK** -> `service` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `NOT NULL` |
| `age_group_id` | `UUID` | Age group modifier. | **FK** -> `age_group`, `NOT NULL` |
| `subscription_term_id`| `UUID` | Billing term modifier (Optional). | **FK** -> `subscription_term` |
| `price` | `DECIMAL` | The cost amount. | `NOT NULL`, Default: `0.00` |
| `is_active` | `BOOLEAN` | Availability flag. | Default: `TRUE` |

**RLS Policy**: Filter by `location_id`.

---

## **5. Discounts & Promotions**

### **Table: `discount_codes`**
Promotional codes that can be applied to subscriptions or invoices.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `discount_id` | `UUID` | Unique identifier. | **PK**, Default: `gen_random_uuid()` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `NOT NULL` |
| `staff_id` | `UUID` | Staff member who created the code. | **FK** -> `staff` |
| `discount_code` | `TEXT` | The unique string used to claim the discount. | `UNIQUE`, `NOT NULL` |
| `discount` | `TEXT` | The value (e.g., "6%" or "6"). | `NOT NULL` |
| `staff_name` | `TEXT` | Denormalized snapshot of the creator's name. | |
| `service_id` | `UUID` | Linked service (if restricted to one). | **FK** -> `service` |
| `is_active` | `BOOLEAN` | If false, the code cannot be used. | Default: `TRUE` |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |
| `updated_at` | `TIMESTAMP` | Last update timestamp. | Default: `NOW()` |

**RLS Policy**: Filter by `location_id`.

---

## **6. Membership Configuration**

### **Table: `membership_program`**
High-level membership grouping (e.g., "Standard Club Access").

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `membership_program_id`| `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `NOT NULL` |
| `name` | `TEXT` | Program name. | `NOT NULL` |
| `is_active` | `BOOLEAN` | Availability flag. | Default: `TRUE` |

**RLS Policy**: Filter by `location_id`.

### **Table: `membership_program_category`**
Variations of a program (e.g., "Family", "Individual").

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `category_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `membership_program_id`| `UUID` | Parent program. | **FK** -> `membership_program`, `NOT NULL` |
| `name` | `TEXT` | Category name. | `NOT NULL` |
| `is_active` | `BOOLEAN` | Availability flag. | Default: `TRUE` |

**RLS Policy**: Filter by `location_id` (via Program).

### **Table: `membership_eligibility_rule`**
Rules determining who qualifies for a category.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `rule_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `category_id` | `UUID` | Parent category. | **FK** -> `membership_program_category`, `NOT NULL` |
| `priority` | `INT` | Evaluation order. | `NOT NULL` |
| `result` | `ENUM` | `ALLOW`, `DENY` | `NOT NULL` |
| `condition_json` | `JSONB` | Logic structure (e.g., `{"min_members": 3}`).| `NOT NULL` |
| `message` | `TEXT` | User-facing message if rule hits. | |

**RLS Policy**: Filter by `location_id` (via Category -> Program).

### **Table: `membership_fee`**
One-time or annual fees for a category.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `membership_fee_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `category_id` | `UUID` | Parent category. | **FK** -> `membership_program_category`, `NOT NULL` |
| `fee_type` | `ENUM` | `JOINING`, `ANNUAL` | `NOT NULL` |
| `billing_cycle` | `ENUM` | `ONE_TIME`, `YEARLY` | `NOT NULL` |
| `amount` | `DECIMAL` | Fee cost. | `NOT NULL`, Default: `0.00` |
| `is_active` | `BOOLEAN` | Availability flag. | Default: `TRUE` |

**RLS Policy**: Filter by `location_id` (via Category -> Program).

### **Table: `membership_service`**
Services bundled into a membership.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `membership_service_id`| `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `membership_program_id`| `UUID` | Parent category (NULL for Base Plan). | **FK** -> `membership_program_category` |
| `location_id` | `UUID` | Location (for Base Plan). | **FK** -> `location` |
| `baseprice_role`| `TEXT` | Role (for Base Plan: PRIMARY/ADD_ON). | |
| `baseprice_age_group_id`| `UUID` | Age Group (for Base Plan). | **FK** -> `age_group` |
| `service_id` | `UUID` | The included service. | **FK** -> `service`, `NOT NULL` |
| `is_included` | `BOOLEAN` | Whether it is free/included. | Default: `TRUE` |
| `usage_limit` | `TEXT` | Cap on usage (e.g., "10 visits"). | |
| `is_part_of_base_plan` | `BOOLEAN` | Core plan component? | Default: `FALSE` |
| `is_active` | `BOOLEAN` | Availability flag. | Default: `TRUE` |
| `discount` | `TEXT` | Discount amount/percent (e.g., "6%", "20").| |

**RLS Policy**: Filter by `location_id` (via Program).

---

## **7. Billing & Subscriptions**

### **Table: `invoice`**
Financial record for a transaction.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `invoice_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `account_id` | `UUID` | Who is being billed. | **FK** -> `account`, `NOT NULL` |
| `location_id` | `UUID` | Location context. | **FK** -> `location`, `NOT NULL` |
| `total_amount` | `DECIMAL` | Total due. | `NOT NULL`, Default: `0.00` |
| `status` | `ENUM` | `DRAFT`, `PAID`, `PARTIAL`, `FAILED` | Default: `DRAFT`, `NOT NULL` |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |

**RLS Policy**: Filter by `location_id`.

### **Table: `payment`**
Money received against an invoice.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `payment_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `invoice_id` | `UUID` | Target invoice. | **FK** -> `invoice`, `NOT NULL` |
| `amount` | `DECIMAL` | Amount paid. | `NOT NULL` |
| `payment_method` | `TEXT` | Card / Cash / ACH. | |
| `gateway_ref` | `TEXT` | External Gateway ID (Stripe, etc). | |
| `status` | `ENUM` | `SUCCESS`, `FAILED`, `PENDING` | Default: `PENDING`, `NOT NULL` |
| `failure_reason` | `TEXT` | Reason for failure if applicable. | |
| `attempted_at` | `TIMESTAMP` | Transaction timestamp. | Default: `NOW()` |

**RLS Policy**: Filter by `location_id` (via Invoice).

### **Table: `subscription`**
Active recurring contract for a service/membership.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `subscription_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `account_id` | `UUID` | Owner account. | **FK** -> `account`, `NOT NULL` |
| `location_id` | `UUID` | Location context. | **FK** -> `location`, `NOT NULL` |
| `invoice_id` | `UUID` | Related invoice. | **FK** -> `invoice` |
| `session_id` | `UUID` | Linked session (Optional). | **FK** -> `session` |
| `subscription_type` | `ENUM` | `BASE`, `MEMBERSHIP_FEE`, `ADDON_SERVICE` | `NOT NULL`, Default: `BASE` |
| `reference_id` | `UUID` | Polymorphic FK to price table. | `NOT NULL` |
| `subscription_term_id` | `UUID` | Billing term FK. | **FK** -> `subscription_term` |
| `unit_price_snapshot` | `DECIMAL` | Price frozen at purchase time. | `NOT NULL` |
| `total_amount` | `DECIMAL` | Total cost. | `NOT NULL` |
| `billing_period_start` | `DATE` | Start of coverage. | |
| `billing_period_end` | `DATE` | End of coverage. | |
| `status` | `ENUM` | `ACTIVE`, `PAID`, `CANCELLED` | Default: `ACTIVE`, `NOT NULL` |
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |

**RLS Policy**: Filter by `location_id`.

### **Table: `session`**
Time-bound sessions for class scheduling or terms.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `session_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `name` | `TEXT` | Session Name (e.g., "Summer 2026"). | `NOT NULL` |
| `start_date` | `DATE` | Start date. | `NOT NULL`|
| `expiry_date` | `DATE` | End date. | `NOT NULL`|
| `created_at` | `TIMESTAMP` | Record creation timestamp. | Default: `NOW()` |
| `updated_at` | `TIMESTAMP` | Record update timestamp. | Default: `NOW()` |

**RLS Policy**: Public read or implementation specific.

### **Table: `subscription_coverage`**
Links specific profiles to a subscription.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `subscription_coverage_id`| `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `subscription_id` | `UUID` | Target subscription. | **FK** -> `subscription`, `NOT NULL` |
| `profile_id` | `UUID` | Profile being covered. | **FK** -> `profile`, `NOT NULL` |
| `role` | `ENUM` | `PRIMARY`, `ADD_ON` | |
| `exempt` | `BOOLEAN` | If true, this person is exempt from billing. | Default: `FALSE` |
| `exempt_reason` | `TEXT` | Rationale for exemption. | |

**RLS Policy**: Inherited via Subscription.
### **Table: `age_group`**
Global age classifications.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `age_group_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `name` | `TEXT` | e.g., "Adult", "Child". | `NOT NULL` |
| `min_age` | `DECIMAL` | Lower bound (inclusive). | `NOT NULL` |
| `max_age` | `DECIMAL` | Upper bound (inclusive). | `NOT NULL` |
| `accept_guardian_information`| `BOOLEAN` | If true, prompts for guardian details.| Default: `FALSE` |
| `is_recurring` | `BOOLEAN` | Whether this group has recurring terms. | Default: `FALSE` |
| `recurrence_unit` | `TEXT` | Period unit (e.g., "MONTH", "YEAR"). | Default: `'MONTH'` |

### **Table: `subscription_term`**
Billing duration definitions.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `subscription_term_id`| `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `NOT NULL` |
| `name` | `TEXT` | e.g., "Monthly". | `NOT NULL` |
| `duration_months` | `INT` | Length in months. | Default: `1`, `NOT NULL` |
| `payment_mode` | `ENUM` | `PAY_IN_FULL`, `RECURRING` | Default: `RECURRING`, `NOT NULL` |
| `recurrence_unit` | `TEXT` | Period unit (e.g., "MONTH", "YEAR"). | Default: `'MONTH'` |
| `is_active` | `BOOLEAN` | Availability flag. | Default: `TRUE` |

**RLS Policy**: Filter by `location_id`.

---
### **Table: `waiver_template`**
Stores waiver document templates which can be mapped to various configurations.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `waiver_template_id`| `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `NOT NULL` |
| `ageprofile_id` | `UUID` | Target age group (Reference). | **FK** -> `age_group` |
| `subterm_id` | `UUID` | Billing duration (Reference). | **FK** -> `subscription_term` |
| `base_price_id` | `UUID` | Base pricing (Reference). | **FK** -> `base_price` |
| `membership_category_id`| `UUID` | Membership category (Reference).| **FK** -> `membership_program_category` |
| `service_id` | `UUID` | Service (Reference). | **FK** -> `service` |
| `content` | `TEXT` | The waiver template content string.| `NOT NULL` |
| `is_active` | `BOOLEAN` | Availability flag. | Default: `TRUE` |
| `created_at` | `TIMESTAMP` | Record creation. | Default: `NOW()` |
| `updated_at` | `TIMESTAMP` | Record update. | Default: `NOW()` |


**RLS Policy**: Filter by `location_id`.

### **Table: `signed_waiver`**
Stored signed waivers linked to profiles.

| Field Name | Type | Description | Key / Constraint |
| :--- | :--- | :--- | :--- |
| `signed_waiver_id` | `UUID` | Unique ID. | **PK**, Default: `gen_random_uuid()` |
| `profile_id` | `UUID` | Profile who signed. | **FK** -> `profile`, `NOT NULL` |
| `waiver_template_id` | `UUID` | Template used. | **FK** -> `waiver_template`, `NOT NULL` |
| `waiver_type` | `TEXT` | Type (SERVICE, MEMBERSHIP, etc). | `NOT NULL` |
| `content` | `TEXT` | Final rendered HTML content. | `NOT NULL` |
| `signature_url` | `TEXT` | Public URL of signature image. | `NOT NULL` |
| `signed_at` | `TIMESTAMPTZ` | When signed. | Default: `now()` |
| `location_id` | `UUID` | Location scope. | **FK** -> `location`, `NOT NULL` |
| `created_at` | `TIMESTAMPTZ` | Record creation. | Default: `now()` |
| `updated_at` | `TIMESTAMPTZ` | Record update. | Default: `now()` |

**RLS Policy**: Filter by `location_id`.

