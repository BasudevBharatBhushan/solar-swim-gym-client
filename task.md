# Project Implementation Tasks

This document outlines the implementation status of the modules defined in `APPLICATION_DOCUMENTATION.md`, distinguishing between completed foundational work (Phase 1) and pending operational features (Phase 2).

## Module: Core System Architecture
### Completed
- [x] **Location Context Implementation**: Location-first model where data is scoped to the selected location.
- [x] **Navigation Structure**: Admin panel navigation and layout.

---

## Module: Onboarding & Registration (Phase 1)
### Completed
- [x] **Staff-Assisted Onboarding**: Admin creation of clients/accounts.
- [x] **Account Creation Data Flow**: Capturing primary contact info, family members, and profiles.
- [x] **Waiver Integration**: Linking signed waivers to profiles and accounts.
- [x] **Self-Onboarding Logic**: User-initiated signup flow (Backend/Frontend integration).
- [x] **Activation Email**: Sending activation emails to new accounts.

### Pending
- [ ] **Advanced Validation**: Dynamic eligibility logic for waivers based on complex criteria (planned for future phases).

---

## Module: Member Portal (User Dashboard)
### Completed
- [x] **Dashboard Access**: Login and view for primary account holders.
- [x] **Profile Viewing**: Viewing associated family members and profiles.
- [x] **Waiver & Contract View**: Accessing signed documents.

### Pending
- [ ] **Self-Service Billing**: managing payment methods and viewing invoices (Part of Phase 2 Billing).

---

## Module: Admin Modules (Location Scoped)
### Completed
- [x] **Lead Management**:
    - [x] Manual lead creation.
    - [x] Lead listing and status tracking.
- [x] **Account Management**:
    - [x] Account listing and search.
    - [x] Detailed account view (profiles, memberships).
    - [x] Adding clients (modal with waiver signing).
    - [x] Reindexing accounts after updates.
- [x] **Profile Management**:
    - [x] Listing and managing individual profiles.
    - [x] Editing profile details.

---

## Module: Settings & Configuration
### Completed
- [x] **Membership Management**:
    - [x] Base Pricing configuration (`BasePlan.tsx`).
    - [x] Membership Plans setup (`Memberships.tsx`).
    - [x] Fee structures (Admission, Renewal).
- [x] **Service Management**:
    - [x] Service listing and configuration (`Services.tsx`).
    - [x] Integration with global Dropdown Values.
- [x] **Subscription Type Management**:
    - [x] Defining billing durations (`SubscriptionTerms.tsx`).
    - [x] Recurrence unit values configuration.
- [x] **Waiver Programs & Rules**:
    - [x] Creating and managing waiver programs (`WaiverPrograms.tsx`).
    - [x] Template management (`WaiverTemplates.tsx`) with preview functionality.
- [x] **Discount Codes & Promotions**:
    - [x] Promotional code creation and management (`DiscountCodes.tsx`).
- [x] **System Settings**:
    - [x] Dynamic Dropdown Values management (`DropdownValues.tsx`).
    - [x] Email Settings configuration (`EmailSettings.tsx`).
    - [x] Staff Management (`StaffManagement.tsx`).

---

## Module: Scheduling & Operational Management (Phase 2)
### Pending / To Do
- [ ] **Scheduling Module**:
    - [ ] Class/Session scheduling interface.
    - [ ] Resource allocation (Pool/Instructor).
    - [ ] Booking management for members and admins.
- [ ] **Billing Control & Advanced Settings**:
    - [ ] Payment Gateway full configuration (Stripe/Provider integration details).
    - [ ] Invoicing generation and automation.
    - [ ] Transaction history and failed payment tracking.
    - [ ] Automated dunning/retry logic.
- [ ] **Advanced Access Control**:
    - [ ] Granular permission sets for different Staff roles.
    - [ ] Multi-location Super Admin vs Single-location Staff constraints (Review & Refine).
- [ ] **Operational Automation**:
    - [ ] Automated reminders for bookings/renewals.
    - [ ] Attendance tracking.

---

## Legend
- [x] **Completed**: Feature is implemented and codebase exists.
- [ ] **Pending**: Feature is planned for Phase 2 or currently under development.
