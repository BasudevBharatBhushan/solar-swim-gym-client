# Implementation Plan: Frontend Waiver Signing (Public & Admin)

## 1. Overview & Scope
The goal of this implementation is to allow Admin/Staff users to generate secure digital waiver requests (for registration, membership, or services) and email them to customers. Customers will click a generated link to access a secure, unauthenticated public page where they can review the waiver content, apply their digital signature, and submit it. The signed waiver will then be recorded in the system and automatically linked to the relevant account and/or subscription.

---

## 2. API Service Integration

### 2.1 Admin/Staff Services
Create or update `src/services/waiverService.ts`:
- **`generateWaiverRequest(payload)`**: Hits `POST /waiver-requests`.
  - Payload: `account_id`, `profile_id`, `waiver_template_id`, `waiver_type`, `expires_in_days`, `subscription_id` (optional), `variables`.
  - Authenticated via standard `apiClient`.
- **`getWaiverStatus(params)`**: Hits `GET /waivers/status`.
  - Query Params: `account_id`, `profile_id` (optional), `status` (optional).
- **`linkWaiverToSubscription(subscriptionId, payload)`**: Hits `PATCH /subscriptions/:subscriptionId/waiver`.
  - Payload: `{ signedwaiver_id }`.
- **`getSignedWaivers()` / `getSignedWaiver(id)`**: Hits `GET /signed-waivers` and `GET /signed-waivers/:signedWaiverId`.

### 2.2 Public Services
Create `src/services/publicWaiverService.ts`:
- **`getWaiverDetails(token: string)`**: Hits `GET /public/waiver-request/:token`.
  - No authentication required.
  - Returns `account_id`, `profile_id`, `waiver_type`, `location_name`, `template_content`, and `resolved_variables`.
- **`submitWaiver(token: string, payload: any)`**: Hits `POST /public/waiver-request/:token/submit`.
  - Payload: `signature_base64`, `final_content`, `agreed` (boolean).
  - No authentication required.

---

## 3. Admin/Staff UI Modifications

### 3.1 Create `GenerateWaiverDialog.tsx`
Create a new standalone dialog component that can be invoked from the Account details or Subscriptions lists.
- **Inputs**:
  - **Waiver Template**: Dropdown to select the base template (`waiver_template_id`).
  - **Type**: Dropdown for `REGISTRATION`, `MEMBERSHIP`, or `SERVICE`.
  - **Variables**: Dynamic input fields based on template requirements.
  - **Expiry (Days)**: Pre-filled (e.g., 7 days).
- **Actions**:
  - **Generate & Copy Link**: Calls `generateWaiverRequest`, constructs the frontend URL, and copies `public_signing_url` to the clipboard.
  - **Generate & Email**: 
    - Calls `generateWaiverRequest` to get the unique link.
    - Preloads an **Email Composition Dialog** with a simple body containing the contract link.
    - Staff reviews the pre-loaded template and hits "Send" to dispatch the message.

### 3.2 Add Waiver Tracking & Linking UI
Update `src/pages/Accounts/AccountDetail.tsx` and `src/pages/Accounts/components/SubscriptionsTab.tsx`:
- Implement a **Waivers Tab** (or a section within **Subscriptions**) that displays data from `getWaiverStatus()`.
- Display a list of **Pending** and **Signed** waivers.
- **Pending Section**: 
  - For each pending request, add a **"View Template"** action.
  - **Template Resolution Logic**: Follows the rules in `Marketplace.tsx`:
    - `SERVICE`: Match `waiverTemplate.service_id` with subscription's `service_id`.
    - `MEMBERSHIP` (Plan): Match `waiverTemplate.membership_category_id` with `subscription.reference_id`.
    - `MEMBERSHIP` (Fee/Term): Match `waiverTemplate.subterm_id` with `subscription.subscription_term_id` OR `waiverTemplate.base_price_id` with `subscription.reference_id`.
- **Signed Section**:
  - Display `waiver_type` and link status.
  - Provide a **"Link to Subscription"** action (opening a small dialog to pick a subscription) which calls `linkWaiverToSubscription`.

### 3.3 Subscription Contract Integration
Update `src/pages/Accounts/components/SubscriptionsTab.tsx`:
- Add a **"View Contract"** button/icon to each subscription row/card (for both Services and Memberships).
- **Behavior**:
  - If the subscription has a `signed_waiver_id` (or `signedcontractid` as per upcoming API update):
    - Fetch the signed waiver via `GET /signed-waivers/:id`.
    - Open a dialog to display the signed HTML content and signature image.
  - If no signed waiver is linked:
    - Display a **"Pending Signing"** status.
    - Optionally allow viewing the **Template** that the user *should* sign, using the Resolution Logic mentioned in 3.2.

---

## 4. Public Signing Page (Sign-in-less)

### 4.1 Routing
- **Target File**: `src/App.tsx`.
- **Update**: Add the routing path `<Route path="/public/sign-waiver" element={<PublicWaiver />} />`. The token is typically passed via query parameter (e.g., `?token=...`).

### 4.2 Create `src/pages/PublicWaiver/PublicWaiver.tsx`
Create a branded, unauthenticated page for waiver review and signing.
- **On Mount**: Parse the token from the URL (`useSearchParams`) and call `publicWaiverService.getWaiverDetails(token)`.
- **State Handling**:
  - **Loading**: Show a branded loading skeleton or spinner.
  - **Error/Invalid**: Handle `404` or token expiry with a neat error message (e.g., "This waiver link is invalid or has expired. Please contact the facility.").
  - **Success**: Display the waiver.
- **Waiver Interface**:
  - Display facility name (`location_name`) and user details.
  - Render the `template_content` securely (e.g., using `dangerouslySetInnerHTML` with manual sanitization).
  - Add a digital signature pad using `react-signature-canvas`.
  - Add a mandatory "I agree to the terms..." checkbox.
  - **Submit Button**: Captures the canvas to base64, fetches the rendered HTML content as `final_content`, and calls `submitWaiver()`.
- **Post-Submission**: Show a "Thank You" screen and hide the form.

---

## 5. Execution Checklist for Developer
- [ ] Define TypeScript interfaces in `src/types/index.ts` for waiver payloads and responses.
- [ ] Implement `waiverService.ts` and `publicWaiverService.ts`.
- [ ] Install signature canvas dependency: `npm install react-signature-canvas`.
- [ ] Develop `GenerateWaiverDialog.tsx`.
- [ ] Update `SubscriptionsTab.tsx` with "View Contract" buttons and "Link to Subscription" logic.
- [ ] Implement the Template Resolution utility function to match waivers to subscriptions.
- [ ] Set up the `/public/sign-waiver` route in `App.tsx`.
- [ ] Build `PublicWaiver.tsx` with the signature canvas and test submission flow.
- [ ] Complete E2E functional testing: Generate -> Email -> Access public link -> Sign -> View signed contract in Account Detail.
