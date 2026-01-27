# 🔍 Payload Debugging Guide

## Issue Detected

The screenshot shows the payload is missing `service_id` and `subscription_type_id`:

**Current Payload** (INCORRECT):
```json
{
  "age_group": "Individual",
  "price": 1,
  "currency": "USD",
  "funding_type": "private"
}
```

**Expected Payload** (CORRECT):
```json
{
  "service_id": "uuid-here",
  "subscription_type_id": "uuid-here",
  "age_group": "Individual",
  "price": 1,
  "currency": "USD",
  "funding_type": "private"
}
```

---

## Root Cause Analysis

The fields are missing because either:
1. `selectedService.id` is `undefined`
2. `subscriptionTypeId` parameter is `undefined`
3. The values are `null` and being stripped by `JSON.stringify()`

---

## Fix Applied

Added detailed logging to `ServiceManager.tsx`:

```typescript
console.log('handlePriceChange called with:', { ageGroup, subscriptionTypeId, price });
console.log('selectedService:', selectedService);
console.log('selectedService.id:', selectedService.id);
console.log('selectedService.service_id:', (selectedService as any).service_id);
```

Also added fallback logic:
```typescript
// Use service_id if it exists, otherwise fall back to id
const serviceId = (selectedService as any).service_id || selectedService.id;
```

---

## How to Debug

### Step 1: Open Browser DevTools
1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Clear the console (click the 🚫 icon)

### Step 2: Trigger the Action
1. Go to Admin Settings → Service Management
2. Select a service (or create one)
3. Enter a price in any field
4. Press Tab or click outside

### Step 3: Check Console Logs
Look for these logs in order:

```
handlePriceChange called with: { ageGroup: "Individual", subscriptionTypeId: "...", price: 50 }
selectedService: { id: "...", service_name: "...", ... }
selectedService.id: "uuid-here"
selectedService.service_id: "uuid-here" or undefined
Creating service plan with payload: { service_id: "...", subscription_type_id: "...", ... }
Payload JSON: { ... }
```

### Step 4: Identify the Problem

**If you see**:
- `selectedService.id: undefined` → Service object doesn't have an `id` field
- `subscriptionTypeId: undefined` → Subscription type ID is not being passed correctly
- `service_id: undefined` in payload → Both `service_id` and `id` are undefined

---

## Possible Issues & Solutions

### Issue 1: Service doesn't have `id` field

**Check**: Look at the `selectedService` log. Does it have `id` or `service_id`?

**Solution**: The Service type has both fields. Check which one has the actual UUID:
```typescript
// If service_id exists, use it
const serviceId = selectedService.service_id || selectedService.id;
```

### Issue 2: Subscription Type ID is undefined

**Check**: Look at the `subscriptionTypeId` parameter in the log

**Solution**: The issue might be in `PricingMatrix.tsx`. Check that it's passing the correct ID:
```typescript
onPriceChange(ageGroup, type.id, val);  // Should be type.id or type.subscription_type_id?
```

### Issue 3: JSON.stringify removes undefined/null values

**Check**: If the values are `undefined` or `null`, they won't appear in the JSON

**Solution**: Ensure all required fields have actual values before creating the payload

---

## Quick Fix Checklist

- [ ] Check console logs for `selectedService` object
- [ ] Verify `selectedService.id` or `selectedService.service_id` has a value
- [ ] Check `subscriptionTypeId` parameter has a value
- [ ] Verify the Service type definition matches the API response
- [ ] Check if `PricingMatrix` is passing the correct subscription type ID

---

## Test Script Comparison

The test script that works uses:
```typescript
{
  service_id: serviceId,              // UUID from created service
  subscription_type_id: subscriptionTypeId,  // UUID from created subscription type
  age_group: ageGroup,
  funding_type: 'private',
  price: 10.00,
  currency: 'USD'
}
```

Your UI should send the exact same structure!

---

## Next Steps

1. **Run the app** and check the console logs
2. **Take a screenshot** of the console output
3. **Share the logs** so we can see what values are actually present
4. **Fix the root cause** based on what the logs show

The detailed logging will tell us exactly what's wrong!
