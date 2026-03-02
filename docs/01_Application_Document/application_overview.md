# Solar Swim Gym — Application Overview

This document provides a complete functional and technical overview of the Solar Swim Gym Client application (Frontend). It explains the user interface architecture, state management for onboarding workflows, administrative controls, membership configuration UI, billing interfaces, and the platform's multi-location operational support.

## Core System Architecture Concept

### Location as Root Context
The entire application operates on a location-first model.
Before accessing any operational module, an admin must select a location. Once selected, all data, configuration, and actions are strictly scoped to that location.

The selected location governs:
- Leads
- Accounts
- Profiles
- Memberships
- Services
- Pricing
- Subscription structures (with duration tracking)
- Waiver & Contract programs
- Billing rules & Invoices
- Transactions & Partial Payments

Each location functions as an independent business unit while remaining within the same platform.

---

## Pre-Sales & Registration System (Phase 1)

This phase establishes the complete pre-sales foundation, focusing on onboarding, configuration, documentation, and account creation before introducing full scheduling and operational automation.

### 1. Onboarding & Registration
The onboarding system supports both admin-initiated and user-initiated flows. Internally, both follow the same logic and data structure. Admins maintain full control, while users can self-complete the same processes.

#### 1.1 Staff-Assisted Onboarding
Admins can create new clients from the Admin Panel for a selected location.

**Step 1: Primary Contact Information**
Captured for the account holder:
- First Name, Last Name
- Email Address (used as login credential)
- Mobile Number
- Date of Birth
- Number of family members to enroll (including self)

This creates the primary profile (head member).

**Step 2: Family Member Details**
Based on the number entered, the system dynamically generates family member forms. Each family member becomes an individual profile under the same account.

Captured per member:
- First Name, Last Name
- Date of Birth
- Email (optional)

*Under-18 Member Management & Guardianship*
If a member is under 18 years of age, guardian and emergency details are mandatory.
- **Guardian Details**: Guardian Name, Mobile Number. Guardian info can be easily duplicated/synced from the primary member details.
- **Emergency Contact**: Emergency Phone Number.

*Waiver / Program Enrollment (Location-Based)*
Members may optionally be associated with location-specific waiver or funding programs (e.g., RCBE). Required information includes Case Manager Name and Email. Program availability and validation rules vary by location.

**Step 3: Account Creation & Activation**
After all member data is saved:
- Account is created in a pending state without a password.
- Activation email is automatically sent to the primary contact.
- The user activates the account by setting a password via secure link.

*Post-Activation Access*
Once signed in, the account holder can view and manage all data under the account, including family profiles, memberships, services, financial history, invoices (including partial payments), and signed contracts.

#### 1.2 Self Onboarding (Self-Signup)
Users can onboard themselves, enter primary/family contact information, provide guardian/emergency details, and select applicable waiver programs based on location. Once submitted, they receive an activation email to create a password.

#### 1.3 Waivers & Contracts
Admins have full flexibility in document execution.
- **Dynamic Previews**: Staff and users can preview contracts with all dynamic variables replaced before signing.
- **Email-Based Signing**: Waivers and contracts can be sent to customers via secure signing links.
- **In-Person Signing**: Staff can present waivers and contracts on a tablet or desktop at the facility.
- All signed documents are securely tracked and permanently attached to the account.

#### 1.4 Payment Flexibility
During onboarding, payment can be completed immediately or skipped. If skipped, the account is created, members are saved, waivers can be signed, and membership remains pending.

### 2. Member Portal (User Dashboard)
After login, the primary account holder can view all information across every profile under the account, including:
- Member profiles
- Active/inactive memberships and services
- Invoices, partial payments, and failed payment attempts
- Signed waivers and contracts

### 3. Admin Modules (Location Scoped)
All admin functionality operates under the selected location.

#### 3.1 Lead & Account Management
- **Leads**: Manual creation, CSV import, registration invite emails.
- **Account Detail**: View all accounts. Expand rows to preview family members or open detailed account views (consistent with member dashboard capabilities).

### 4. Settings & Configuration (Location-Based)
All configuration is managed within Admin Settings and applies only to the selected location.

#### 4.1 Membership Management
Membership management defines how pricing and fees are applied during enrollment. 

**A. Base Pricing & Services**
Base pricing represents the standard service cost before any membership benefits or discounts are applied. Configured at the service level (e.g., Individual, Dual, Senior 65+, Junior).

**B. Subscription Terms & Durations**
Subscription terms define how long and how frequently services are billed, explicitly mapping to a specific `duration_months`. This allows accurate forecasting and contract generation.

**C. Membership Plans (Marketplace & Club Memberships)**
Membership plans represent the club-level enrollment a customer opts into, applying on top of base pricing to modify the cost dynamically.

Each membership plan controls:
- Eligibility rules
- Discounts applied to base service pricing
- One-time admission (joining) fee
- Annual/Recurring renewal or membership fee logic

#### 4.2 Invoicing & Billing Workflows
- **Global & Account Invoices**: Invoices are tracked at both the global location level and individual account level.
- **Status Tracking**: Visual color-coding maps to invoice status (Paid, Pending, Overdue).
- **Partial Payments**: Flexible payment workflows allow customers or staff to pay invoices partially, tracking `AmountDue` and linked `payment_transactions` incrementally.

#### 4.3 Discount Codes & Promotions
Custom promotional codes can be created supporting percentage-based or flat-rate discounts. Codes track the creating staff member and can be toggled via status control.

### 5. Deployment & Technical Stack
- **Frontend Framework**: React (Vite)
- **Language**: TypeScript
- **State Management**: React Context API & Custom Hooks
- **Styling**: Material UI (MUI) and Custom CSS
- **API Integration**: Centralized Service Layer (`src/services`) consuming RESTful APIs

---

## Scheduling & Operational Management (Phase 2)

Phase 2 builds on the groundwork laid in Phase 1 and concentrates on service delivery operations, such as scheduling, advanced billing controls, and role-based access.

### Need Analysis
Phase 2 includes Scheduling, Billing Settings & Rules, and Advanced User Control. Continuing development involves refining real-time operational workflows.

### Billing Control & Advanced Settings
A dedicated Billing Settings section exists per location for:
- Payment gateway configuration
- Membership-related billing rules
- Waiver-based billing behavior
- Advanced transaction history and failed payment tracking

### Advanced Access Control (RBAC)

**Super Admin**
- Access to all locations
- Global configuration and reporting capabilities
- Capable of assigning roles

**Admin (Staff)**
- Restricted to explicitly assigned locations
- Cannot access data or configuration from other branches
- Capabilities tightly scoped to operational needs (managing accounts, invoices, and scheduling)
