# Admin Settings - Service Plan Fixes

## Issues Fixed

### 1. **Auto-calculation for Multi-month Subscriptions** ✅
**Problem**: When entering a price for 1-month subscription, it was not properly auto-filling 3-month and 6-month values.

**Solution**: 
- Enhanced `PricingMatrix.tsx` to detect when a 1-month base price is entered
- Automatically calculates and prefills other subscription durations (3-month = 3× base, 6-month = 6× base, etc.)
- Only auto-fills if the target field is empty, allowing individual modification

**Example**:
- Enter $50 for "Individual" at "1 month"
- System auto-fills:
  - 3 months: $150 (50 × 3)
  - 6 months: $300 (50 × 6)
  - 12 months: $600 (50 × 12)
- You can then manually edit any of these values

### 2. **Individual Field Modification** ✅
**Problem**: Fields were being overwritten when entering values.

**Solution**:
- Auto-fill only triggers when:
  1. You're entering a 1-month base price
  2. The target field is currently empty (0 or unset)
- Once a field has a value, it won't be auto-filled again
- Each field can be manually edited at any time

### 3. **Missing `service_id` in Payload** ✅
**Problem**: API was returning 500 error because `service_id` was missing from the payload.

**Solution**:
- Updated `ServiceManager.tsx` to always include `service_id` in the payload
- Added `funding_type` field (defaults to 'private')
- Proper payload structure:
```typescript
{
  service_id: "uuid-of-service",
  subscription_type_id: "uuid-of-subscription-type",
  age_group: "individual",
  funding_type: "private",
  price: 100.00,
  currency: "USD"
}
```

### 4. **Age Group Mismatch** ✅
**Problem**: UI used labels like "Individual", "Individual Plus", "Senior 65+" but backend expected different values.

**Solution**:
- Created proper mapping between UI labels and backend values:

| UI Label | Backend Value |
|----------|--------------|
| Individual | `individual` |
| Individual Plus | `individual_plus` |
| Senior 65+ | `senior_65_plus` |
| Add 18yr+ | `add_18_plus` |
| 13yr–17yr | `teen_13_17` |
| 6mo–12yr | `child_6mo_12yr` |

- Applied mapping in both `ServiceManager.tsx` and `MembershipManager.tsx`

## How to Use

### Adding a Service with Pricing

1. **Navigate to Admin Settings → Service Management**

2. **Create a Service**:
   - Enter service name (e.g., "Swimming Lessons")
   - Check "Active" if you want it immediately available
   - Click "Create Service"

3. **Set Pricing**:
   - Click on the newly created service in the list
   - The pricing matrix will appear
   - **Start with the 1-month column** for best auto-fill experience:
     - Enter price for "Individual" at "1 month": $50
     - System auto-fills: 3mo=$150, 6mo=$300, 12mo=$600
   - Repeat for other age groups
   - Manually adjust any auto-filled values if needed

4. **Save Changes**:
   - Click "Save Changes" button
   - System will send individual API calls for each price

### Adding a Membership with Pricing

1. **Navigate to Admin Settings → Membership Management**

2. **Create a Membership**:
   - Enter membership name (e.g., "Gold Pass")
   - Add description (optional)
   - Check "Active"
   - Click "Create Membership"

3. **Set Pricing**:
   - Same process as services
   - Start with 1-month column for auto-fill

4. **Bundle Services** (optional):
   - Scroll to "Bundled Services" section
   - Check services to include
   - Mark as:
     - **CORE**: Included in membership (no extra charge)
     - **ADDON**: Optional add-on (charges apply)

## Testing the APIs

### Run Comprehensive Test
```bash
npx tsx src/scripts/test-admin-api-comprehensive.ts
```

This script will:
- Test all admin endpoints
- Discover valid age_group values
- Show exact API responses
- Identify any errors

### Update Test Credentials
Edit `test-admin-api-comprehensive.ts`:
```typescript
const EMAIL = 'your-admin@email.com';
const PASSWORD = 'your-password';
```

## API Payload Examples

### Create Service Plan
```json
{
  "service_id": "550e8400-e29b-41d4-a716-446655440000",
  "subscription_type_id": "660e8400-e29b-41d4-a716-446655440000",
  "age_group": "individual",
  "funding_type": "private",
  "price": 50.00,
  "currency": "USD"
}
```

### Create Membership Plan
```json
{
  "membership_id": "770e8400-e29b-41d4-a716-446655440000",
  "subscription_type_id": "660e8400-e29b-41d4-a716-446655440000",
  "age_group": "individual_plus",
  "funding_type": "private",
  "price": 150.00,
  "currency": "USD"
}
```

## Important Notes

⚠️ **Age Group Values**: The backend expects specific enum values. Always use the mapped values shown in the table above.

⚠️ **Service ID**: Always include `service_id` when creating service plans.

⚠️ **Funding Type**: Currently defaults to 'private'. Can be extended to support 'rceb' or other funding types.

⚠️ **Auto-fill Logic**: Only works when entering 1-month base prices. If you start with 3-month or 6-month, auto-fill won't trigger.

## Troubleshooting

### 500 Error when creating service plan
- Check that `service_id` is included in payload
- Verify `age_group` value matches backend enum
- Ensure `subscription_type_id` is valid

### Auto-fill not working
- Make sure you're entering the 1-month column first
- Target fields must be empty (0 or unset)
- Check that subscription type has `billing_interval_unit: 'month'` and `billing_interval_count: 1`

### Age group not accepted
- Refer to the mapping table above
- Use lowercase with underscores (e.g., `individual_plus` not `Individual Plus`)
- Run the comprehensive test script to verify valid values

## Files Modified

1. `src/pages/admin/components/settings/PricingMatrix.tsx`
   - Enhanced auto-fill logic
   - Better handling of individual field modifications

2. `src/pages/admin/components/settings/ServiceManager.tsx`
   - Fixed age group mapping
   - Added service_id to payload
   - Added funding_type field

3. `src/pages/admin/components/settings/MembershipManager.tsx`
   - Fixed age group mapping
   - Added funding_type field

4. `src/scripts/test-admin-api-comprehensive.ts` (NEW)
   - Comprehensive API testing script
