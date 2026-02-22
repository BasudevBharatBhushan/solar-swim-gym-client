# Marketplace Rules Documentation

This file serves as a centralized repository for all business rules, eligibility logic, and pricing constraints implemented within the Marketplace.

---

## 1. Membership Eligibility Rules
These rules determine which membership programs and categories a household is eligible for based on its composition.

*   **Rule Logic**: The system counts the number of children, adults, and seniors in a household. It then checks these counts against the `min` and `max` ranges defined in the membership category's `condition_json`.
*   **Key Parameters**: 
    *   `minChild` / `maxChild`
    *   `minAdult` / `maxAdult`
    *   `minSenior` / `maxSenior`
*   **Implementation File**: `src/pages/Marketplace/membershipSuggestion.ts`
    *   Functions: `isCategoryEligible`, `extractCategoryRange`, `buildHouseholdCountsFromBaseCart`.

### 1.1 Add-on Role Constraints
*   **Rule Logic**: A user cannot purchase an "ADD_ON" membership (e.g., for a spouse or child) unless they have an active "PRIMARY" membership subscription OR a "PRIMARY" membership item currently in their cart.
*   **Enforcement**: 
    *   The "Add" button for Add-on cards is disabled or shows an error if no Primary is detected.
    *   Validation checks both active subscriptions (via `billingService.getAccountSubscriptions`) and current cart contents.
*   **Coverage Dialog Behavior**: 
    *   Profiles are automatically **disabled and unchecked** in the selection modal if they already hold an active membership or if the same plan is already assigned to them in the cart.
    *   This prevents duplicate assignments and ensures that only eligible family members can be selected for a new plan or fee.
*   **Implementation File**: `src/pages/Marketplace/Marketplace.tsx`
    *   Logic: `hasActivePrimary` check, `handleStartAddBaseCard`, and `openCoverageDialogForItem`.

---

## 2. Age Group Rules
Rules that categorize users into specific groups based on their Date of Birth (DOB) to filter products like Base Plans and Service Packs.

*   **Rule Logic**: Calculates age based on the current date and DOB, then finds the corresponding age group configured for the location.
*   **Membership Specific Bucketing**: For membership eligibility, users are hard-coded into three buckets:
    *   **Child**: < 18 years
    *   **Adult**: 18 - 64 years
    *   **Senior**: 65+ years
*   **Implementation Files**: 
    *   `src/lib/ageUtils.ts` (General age group mapping)
    *   `src/pages/Marketplace/membershipSuggestion.ts` (Function: `classifyAgeFromDob` for membership ranges)

---

## 3. Automatic Membership Discounts
Rules that automatically apply discounts to items in the cart based on other items present (e.g., holding a Membership grants a discount on a Service Pack).

*   **Rule Logic**: When a Membership or Base Plan is added to the cart, the system fetches the list of services/packs that are discounted by that specific plan. If a matching Service Pack is found in the cart, the discount is applied automatically with an explanation.
*   **Override Rule**: If a user manually applies a promo code, it may override or prevent the automatic membership discount, depending on the "autoDiscountDisabled" flag.
*   **Implementation File**: `src/pages/Marketplace/Marketplace.tsx`
    *   Logic: `fetchMembershipDiscounts` effect and the discount application effect.

---

## 4. Promo Code Validation Rules
Rules governing the manual application of discount codes.

*   **Rule Logic**:
    *   **Active Status**: Code must have `is_active: true`.
    *   **Date Range**: Current date must be between `start_date` and `end_date` (if defined).
    *   **Service Specificity**: If a code is linked to a specific `service_id`, it can only be applied to items belonging to that service. Codes with no `service_id` are considered global.
*   **Implementation Files**: 
    *   `src/services/discountService.ts` (Data fetching and API validation)
    *   `src/pages/Marketplace/Marketplace.tsx` (Logic: `handleApplyDiscountCode`)

---

## 5. Service Pack Constraints
Rules defining the limits and usage behavior of service packs.

*   **Rule Logic**:
    *   **Student Allowance**: Restricts the number of students that can be assigned to a single pack (`students_allowed`).
    *   **Shareability**: Determines if a pack can be shared across multiple family members (`is_shrabable`).
    *   **Usage Limits**: Enforces how many times a pack can be used within a specific period if `enforce_usage_limit` is enabled.
    *   **Purchase Frequency Limit**: Restricts the total number of "classes" or redemptions a user can purchase within a specific usage period based on `max_uses_per_period`.
        *   **Calculation**: Total Projected Usage = (Active Subscriptions Usage) + (Current Cart Usage) + (New Purchase Usage).
        *   If Total Projected Usage > `max_uses_per_period`, the purchase is blocked.
    *   **Age-Group Eligibility**: A profile is only eligible for a service pack if its mapped Age Group has a specific price defined for that pack. Profiles without a valid price are disabled in the selection UI.
*   **Implementation Files**: 
    *   `src/services/serviceCatalog.ts` (Interface definitions: `ServicePack`)
    *   `src/pages/Marketplace/ServicePackSelectionDialog.tsx` (Logic: `eligibleProfiles` useMemo)

---

## 6. Selection & Billing Rules
Rules governing how items are structured in the cart and how their dates are determined.

*   **Rule Logic**:
    *   **Consolidated Selection (Multi-Select)**: If multiple profiles are selected *simultaneously* in the coverage modal for a Membership Plan or Fee, they are grouped into a **single cart line item** with multiple covers.
    *   **Sequential Selections (Separate Lines)**: If a user adds a plan/fee for Profile A, completes it, and then separately clicks "Add" again to add the same plan/fee for Profile B, the system creates **separate cart line items**.
    *   **Identification Logic**: This is enforced using timestamped internal IDs (e.g., `BASE-ID-TIMESTAMP`) which ensure that each initiation of an "Add" action is treated as a distinct transaction.
    *   **Sharable Item Structure**: For Service Packs, if a pack is sharable, selecting multiple profiles creates **one** cart item. The price is taken from the first profile selected (the primary), and other profiles are added as "ADD_ON" coverage.
    *   **Non-Sharable Item Structure**: For Service Packs, if a pack is NOT sharable, selecting multiple profiles creates **multiple** separate cart items.
    *   **Session-Based Billing**: When a session is selected, the `billing_period_start` and `billing_period_end` are automatically populated from the session's start and expiry dates.
*   **Implementation Files**: 
    *   `src/pages/Marketplace/Marketplace.tsx` (Logic: `handleConfirmCoverage` and `handleConfirmFeeSelection`)
    *   `src/pages/Marketplace/ServicePackSelectionDialog.tsx` (Logic: `handleConfirm` and `handleSessionChange`)

---

## 7. Role-Based Permission Rules
Rules determining who can perform specific actions in the marketplace.

*   **Rule Logic**: Only users with the roles `SUPERADMIN`, `ADMIN`, or `STAFF` are permitted to apply manual discounts (amount or percentage) to cart items. Customers (Members) can only apply Promo Codes.
*   **Implementation File**: `src/pages/Marketplace/Marketplace.tsx`
    *   Variable: `canApplyManualDiscount`

---

## 8. Location Context Rules
*   **Rule Logic**: All products (Base Plans, Memberships, Services) are filtered by the `currentLocationId`. Users cannot purchase products from a location other than the one currently selected in their session.
*   **Implementation File**: `src/pages/Marketplace/Marketplace.tsx`
    *   Logic: `loadData` function uses `currentLocationId` in all API headers.
