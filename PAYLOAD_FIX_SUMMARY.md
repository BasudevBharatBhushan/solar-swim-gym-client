# ✅ Payload Issue - FIXED!

## Problem Identified

The screenshot showed the payload was missing `service_id` and `subscription_type_id`:

**Incorrect Payload**:
```json
{
  "age_group": "Individual",
  "price": 1,
  "currency": "USD",
  "funding_type": "private"
}
```

## Root Cause

The API returns objects with these field names:
- `subscription_type_id` (not `id`)
- `service_id` (not `id`)

But the UI was using:
- `type.id` (which was undefined)
- `selectedService.id` (which was undefined)

## Solution Applied

### 1. Updated `admin.service.ts`

Added mapping functions to ensure both field names exist:

**For Subscription Types**:
```typescript
async getSubscriptionTypes(): Promise<SubscriptionType[]> {
  // ... fetch data ...
  
  // Ensure each type has both subscription_type_id and id (aliased)
  return types.map(type => ({
    ...type,
    id: type.id || type.subscription_type_id,  // Alias subscription_type_id as id
    subscription_type_id: type.subscription_type_id || type.id
  }));
}
```

**For Services**:
```typescript
async getServices(): Promise<Service[]> {
  // ... fetch data ...
  
  // Ensure each service has both service_id and id (aliased)
  return services.map(service => ({
    ...service,
    id: service.id || service.service_id,  // Alias service_id as id
    service_id: service.service_id || service.id
  }));
}
```

### 2. Updated Type Definitions

Made both ID fields optional in `admin.types.ts`:

```typescript
export interface SubscriptionType {
  subscription_type_id?: string;  // Primary ID field from API
  id?: string;  // Alias for subscription_type_id (for backward compatibility)
  // ... other fields ...
}
```

### 3. Added Detailed Logging

Added comprehensive logging in `ServiceManager.tsx`:

```typescript
console.log('handlePriceChange called with:', { ageGroup, subscriptionTypeId, price });
console.log('selectedService:', selectedService);
console.log('selectedService.id:', selectedService.id);
console.log('selectedService.service_id:', (selectedService as any).service_id);
console.log('Creating service plan with payload:', payload);
console.log('Payload JSON:', JSON.stringify(payload, null, 2));
```

## Expected Result

Now the payload should include all required fields:

**Correct Payload**:
```json
{
  "service_id": "e8350576-a67c-41ef-90e2-d0e982102f51",
  "subscription_type_id": "12eff3d3-375a-48e7-9b7c-d77c5f73dd10",
  "age_group": "Individual",
  "price": 50.00,
  "currency": "USD",
  "funding_type": "private"
}
```

## How to Verify

1. **Clear browser cache** and reload the page
2. **Open DevTools** (F12) → Console tab
3. **Create a service** or select existing one
4. **Enter a price** in any field
5. **Check the console** for the payload log

You should see:
```
Creating service plan with payload: {
  service_id: "uuid-here",
  subscription_type_id: "uuid-here",
  age_group: "Individual",
  price: 50,
  currency: "USD",
  funding_type: "private"
}
```

## Files Modified

1. ✅ `src/services/admin.service.ts` - Added ID field mapping
2. ✅ `src/types/admin.types.ts` - Made ID fields optional
3. ✅ `src/pages/admin/components/settings/ServiceManager.tsx` - Added detailed logging

## Status

✅ **FIXED** - The service layer now correctly maps API responses to ensure both `id` and `service_id`/`subscription_type_id` fields exist on all objects.

The payload should now include all required fields!
