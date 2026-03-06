# Solar Swim Gym — Application Documentation

This document provides a complete functional and technical overview of the Solar Swim Gym platform. It explains the system architecture, onboarding workflows, administrative controls, membership and pricing configuration, and the phased rollout strategy designed to support multi-location operations.

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
- Subscription structures
- Waiver programs
- Billing rules
- Transactions

Each location functions as an independent business unit while remaining within the same platform.

---

## PHASE 1 — Pre-Sales & Registration System

Phase 1 focuses on onboarding, configuration, documentation, and account creation. This phase establishes the complete pre-sales foundation before introducing scheduling and operational automation.

### 1. Onboarding & Registration
The onboarding system supports both admin-initiated and user-initiated flows. Internally, both follow the same logic and data structure.
Admins maintain full control, while users can self-complete the same processes.

#### 1.1 Staff-Assisted Onboarding
Admins can create new clients from the Admin Panel for a selected location.

**Step 1: Primary Contact Information**
Captured for the account holder:
- First Name
- Last Name
- Email Address (used as login credential)
- Mobile Number
- Date of Birth
- Number of family members to enroll (including self)

This creates the primary profile (head member).

**Step 2: Family Member Details**
Based on the number entered, the system dynamically generates family member forms.
Each family member becomes an individual profile under the same account.

Captured per member:
- First Name
- Last Name
- Date of Birth
- Email (optional)

*Under-18 Member Handling*
If a member is under 18 years of age, the following fields are mandatory:
- **Guardian Details**
    - Guardian Name
    - Guardian Mobile Number
- **Emergency Contact**
    - Emergency Phone Number

These fields are required for safety and waiver compliance.

*Waiver / Program Enrollment (Location-Based)*
Members may optionally be associated with location-specific waiver or funding programs such as:
- RCBE (Regional Center of the East Bay)
- Other government or partner-funded programs

When selected, the following information is required:
- Case Manager Name
- Case Manager Email

Program availability and validation rules vary by location.

**Step 3: Account Creation & Activation**
After all member data is saved:
- Account is created in a pending state
- No password is required initially
- Activation email is automatically sent to the primary contact
- The user activates the account by setting a password via secure link.

*Post-Activation Access*
Once signed in, the account holder can view and manage all data under the account:
- All family member profiles
- Memberships assigned to members
- Services and add-ons
- Financial history
- Invoices and payment attempts
- Signed waivers and contracts

#### 1.2 Self Onboarding (Self-Signup)
Users may also onboard themselves.
During signup, users can:
- Enter primary contact information
- Add all family members
- Provide guardian and emergency details
- Select applicable waiver programs based on location

After submission:
- Activation email is sent
- Password is created
- Account becomes active
- All information can be viewed and edited after login or can be emailed.

#### 1.3 Waivers & Contracts
Admins have full flexibility in document execution.

- **Email-Based Signing**: Waivers and contracts can be sent to customers via secure signing links.
- **In-Person Signing**: Staff can open waivers and contracts on a tablet or desktop. Customers can sign digitally at the facility.
- All signed documents are stored and permanently linked to the account.

#### 1.4 Payment Flexibility (Phase 1)
During onboarding:
- Payment can be completed immediately
- Or skipped if the customer is not ready

Even without payment:
- Account is created
- Members are saved
- Waivers can be signed
- Membership can remain pending

This supports real front-desk and pre-sales workflows.

### 2. Member Portal (User Dashboard)
After login, the primary account holder can view all information across every profile under the account.
The dashboard provides access to:
- Member profiles
- Active and inactive memberships
- Services and add-ons
- Invoices and payments
- Failed payment attempts
- Signed waivers and contracts

### 3. Admin Modules (Location Scoped)
All admin functionality operates under the selected location.

#### 3.1 Lead Management
- Manual lead creation
- Bulk CSV import
- Registration invite emails
- Customizable list columns

#### 3.2 Account Management
- View all accounts for the location
- Expand rows to preview family members
- Open detailed account view identical to the member dashboard

#### 3.3 Profile Management
- Central list of all individual profiles under the location
- Search and quick access

### 4. Settings & Configuration (Location-Based)
All configuration is managed within Admin Settings and applies only to the selected location.

#### 4.1 Membership Management
Membership management defines how pricing and fees are applied during enrollment. It is configured under Admin Settings and is fully location-based.
The structure is designed to match real-world club operations and remain simple for both staff and customers to understand.

**A. Base Pricing (Service-Level Pricing)**
Base pricing represents the standard service cost before any membership benefits are applied.
This pricing is configured at the service level and acts as the default rate.
Examples include:
- Individual
- Dual
- Senior 65+
- Add 18yr+
- Add 14yr–17yr
- Junior (14yr–17yr)
- 6mo–13yr

Base pricing does not include:
- Membership discounts
- Admission (joining) fees
- Renewal fees

**B. Subscription Type Reference**
The billing duration (such as monthly or multi-month plans) is controlled through Subscription Type Management, which defines how long and how frequently services are billed.

**C. Membership Plans (e.g., Club Membership)**
Membership plans represent the club-level enrollment a customer opts into.
These are not service types — they sit on top of base pricing and modify how pricing behaves.

Examples include:
- Single Club Membership
- Dual Club Membership
- Family Club Membership
- Senior Club Membership
- Junior Club Membership

These membership plans act as predefined categories configured per location.

*What Membership Plans Control*
Each membership plan can define:
- Fixed eligibility type (configured statically)
- Discount applied on base service pricing
- One-time admission (joining) fee
- Annual renewal fee

Eligibility rules are predefined and static in Phase 1. Advanced dynamic eligibility logic is planned for future phases.

Membership can also contain some bundled services.

**Pricing Flow Summary**
1. Base service price is selected
2. Subscription type defines billing duration
3. Membership plan (if opted) applies:
    - Discount on base pricing
    - Admission fee (one-time)
    - Renewal fee (yearly)

*Administrative Control*
Admins can:
- Create multiple membership plans per location
- Modify discounts and fees
- Enable or disable memberships as needed
- Adjust membership values without changing base service pricing

This ensures flexibility while keeping pricing logic simple and consistent across locations.

#### 4.2 Service Management
Admins can configure all services offered at a location, such as:
- Swimming lessons
- Gym access
- Programs and add-ons

Services define the base pricing structure before membership discounts are applied.

#### 4.3 Subscription Type Management
Subscription types control how services are billed.
Admins can define and manage subscription structures dynamically, including:
- Duration-based subscriptions
- Paid-in-full options
- Custom billing cycles

These subscription types are fully configurable and not hard-coded.

#### 4.4 Waiver Programs & Rules
Each location can define its own waiver or funding programs.
Configuration includes:
- Program availability
- Required member fields
- Case manager requirements
- Eligibility validation rules
- Billing behavior restrictions

This supports regional, government, or partner-funded clients with unique workflows.

#### 4.5 Discount Codes & Promotions
Admins can create promotional codes to be used during checkout or subscription creation.
- **Custom Codes**: Define unique alphanumeric strings (e.g., WINTER6).
- **Flexible Values**: Support for percentage-based (e.g., 6%) or flat-rate (e.g., 6) discounts.
- **Tracking**: Each code stores the name of the staff member who created it for audit purposes.
- **Status Control**: Codes can be toggled active/inactive without deletion.

### 5. Deployment, Training & Support
- **Frontend**: React
- **Backend APIs**: Node (Hosted in Vercel) Approx $60/mo
- **Database**: Supabase (PostgreSQL) Approx $25/mo
- **Search**: Elasticsearch Cloud

---

## PHASE 2 — Scheduling & Operational Management

Phase 2 builds on the groundwork laid in Phase 1 and concentrates on service delivery operations.
This phase begins with a detailed review and validation of all planned features and specifications, with Scheduling, Billing, and Access Control Settings identified as the primary focus areas from prior discussions.
Phase 2 activities are designed to run concurrently with the implementation of Phase 1.

### Need Analysis
Phase 2 will include Scheduling, Billing Settings & Rules, and Advanced User Control.
Several items discussed in the last meeting will require further clarification and detailed need analysis before implementation.

### Billing Control & Advanced Settings
A dedicated Billing Settings section will be available for each location.
It will include:
- Payment gateway configuration
- Membership-related billing rules
- Waiver-based billing behavior
- Transaction history
- Failed payment tracking

Phase 1 focuses on configuration, visibility, and data capturing process.
Phase 2 will extend this into operational billing management and automation.

### Advanced Access Control

**Super Admin**
- Access to all locations
- Global configuration and reporting

**Admin (Staff)**
- Restricted to assigned locations
- Cannot access data from other branches
