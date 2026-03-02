# Solar Swim Gym — Backend Structure

This document outlines the high-level architecture, technology stack, and structural organization of the Solar Swim Gym Backend II. The content is derived from the core technical documents: API Documentation and Database Architecture.

## 1. System Architecture Overview

*   **Platform**: Node.js backend serving RESTful APIs.
*   **Database Engine**: PostgreSQL (managed via Supabase).
*   **Multi-tenant Architecture**: The system serves multiple geographic locations under the same tenant. The root entity of data isolation is `location_id`.
*   **Security & Isolation**: Row-Level Security (RLS) policies are applied natively to PostgreSQL tables to ensure data isolation. Records strictly filter to match `app.current_location_id` for location-scoped staff/admins.
*   **Extensions**: 
    *   `uuid-ossp` (UUID generation for all Primary Keys).
    *   `pgcrypto` (Hashing and Encryption).

## 2. Core Modules & Engine Elements

### 2.1 Identity & Access Management (IAM)
*   **Staff Profiles**: Separated into `STAFF`, `ADMIN`, and `SUPERADMIN` roles. Staff access is isolated by `location_id`.
*   **Users/Members**: Groups individuals (profiles) into family billing entities (`account`). Authentication is isolated based on registered email and linked profiles.
*   **Session Management**: JWT tokens encode `staff_id`, `role`, and `location_id` metadata. Superadmins have a specialized endpoint to dynamically swap `location_id` contexts globally.

### 2.2 Billing & Subscription Engine
*   **Subscriptions**: Central recurring billing logic supporting memberships, service plans, and one-off packs. Handles renewals, prorations, and grace periods natively.
*   **Invoicing**: Every financial transaction initiates from an `invoice`. Invoices trace back to `account_id` and track `total_amount` vs `AmountDue`.
*   **Payment Gateway**: Uses Cayan Vault for secure tokenized card storage (`saved_payment_methods`) and logging all gateway operations (`payment_transactions`).

### 2.3 CRM & Service Routing
*   **Leads & Accounts**: Pre-sale leads are tracked before converting to full accounts. Built-in hooks periodically index CRM data to an **Elasticsearch** cluster for rapid fuzzy searches across members and leads.
*   **Services & Pricing**: A heavily nested service catalog (Services > Age Groups > Subscription Terms) supports pricing variations cleanly without duplicating code.

### 2.4 Notifications System
*   **SMTP Configuration**: Configured independently per location via `email_smtp_config`. 
*   **Templating**: Reusable `email_template` entities allow for dynamic notifications.
*   **Audit**: Complete history of sent and failed emails persists via `email_log`.

## 3. Reference Documents

For specific endpoint contracts and schema definitions, please refer to the following specific documentation:
- **[API Documentation](./api_documentation.md)**: Details on all REST endpoints across Auth, Config, Services, Memberships, CRM, and Billing.
- **[Database Architecture](./db_architecture.md)**: Complete PostgreSQL schema breakdown including tables, PK/FK relationships, and specific Row-Level Security definitions.
