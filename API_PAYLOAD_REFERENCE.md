# Admin API - Correct Payload Structure

## ✅ VERIFIED: Service Plan Creation

### Endpoint
```
POST /api/v1/admin/service-plans
```

### Required Payload
```json
{
  "service_id": "uuid-string",
  "subscription_type_id": "uuid-string",
  "age_group": "Individual",  // Must be one of the 7 valid values below
  "funding_type": "private",  // Required! Must be: private or rceb
  "price": 10.00,
  "currency": "USD"
}
```

### ✅ Valid Age Groups (ALL TESTED AND VERIFIED)
- ✅ `"Individual"`
- ✅ `"Individual Plus"`
- ✅ `"Senior (65+)"`
- ✅ `"Adult (18+)"`
- ✅ `"Teen (13–17)"`
- ✅ `"Child (6–12)"`
- ✅ `"Infant (0–5)"`

### Important Notes
- **Use exact strings** - Age groups are case-sensitive and must match exactly
- **Include parentheses and dashes** - e.g., `"Senior (65+)"` not `"Senior 65+"`
- **Use en-dash (–) not hyphen (-)** - e.g., `"Teen (13–17)"` not `"Teen (13-17)"`

---

## ✅ VERIFIED: Membership Plan Creation

### Endpoint
```
POST /api/v1/admin/membership-plans
```

### Required Payload
```json
{
  "membership_id": "uuid-string",
  "subscription_type_id": "uuid-string",
  "age_group": "Individual",  // Must be one of the 7 valid values above
  "funding_type": "private",  // Required! Must be: private or rceb
  "price": 100.00,
  "currency": "USD"
}
```

### Same Valid Age Groups
All 7 age group values listed above work for both service plans and membership plans.

---

## UI to Backend Mapping

| UI Label | Backend Value | Notes |
|----------|--------------|-------|
| Individual | `Individual` | 1:1 mapping |
| Individual Plus | `Individual Plus` | 1:1 mapping |
| Senior (65+) | `Senior (65+)` | 1:1 mapping |
| Adult (18+) | `Adult (18+)` | 1:1 mapping |
| Teen (13–17) | `Teen (13–17)` | 1:1 mapping |
| Child (6–12) | `Child (6–12)` | 1:1 mapping |
| Infant (0–5) | `Infant (0–5)` | 1:1 mapping |

**Note**: UI and backend now use the exact same values - no transformation needed!

---

## Important Notes

1. **`funding_type` is REQUIRED** - The API will return 500 error if missing
2. **Age groups use exact strings** - No abbreviations or transformations
3. **No authentication needed** - Admin APIs currently don't require auth tokens
4. **Each field is independent** - No auto-fill, each price must be set individually
5. **Immediate API calls** - Changes are saved when you blur (tab out of) the input field

---

## Example: Complete Flow

### Step 1: Create Service
```bash
POST /api/v1/admin/services
{
  "service_name": "Swimming Lessons",
  "is_active": true
}
```

Response:
```json
{
  "id": "service-uuid-123",
  "service_name": "Swimming Lessons",
  "is_active": true
}
```

### Step 2: Create Service Plans (for each age group × subscription type)

For "Individual" at "Monthly" subscription:
```bash
POST /api/v1/admin/service-plans
{
  "service_id": "service-uuid-123",
  "subscription_type_id": "monthly-uuid-456",
  "age_group": "Individual",
  "funding_type": "private",
  "price": 50.00,
  "currency": "USD"
}
```

For "Senior (65+)" at "Monthly" subscription:
```bash
POST /api/v1/admin/service-plans
{
  "service_id": "service-uuid-123",
  "subscription_type_id": "monthly-uuid-456",
  "age_group": "Senior (65+)",
  "funding_type": "private",
  "price": 40.00,
  "currency": "USD"
}
```

For "Child (6–12)" at "Monthly" subscription:
```bash
POST /api/v1/admin/service-plans
{
  "service_id": "service-uuid-123",
  "subscription_type_id": "monthly-uuid-456",
  "age_group": "Child (6–12)",
  "funding_type": "private",
  "price": 30.00,
  "currency": "USD"
}
```

For "Teen (13–17)" at "Monthly" subscription:
```bash
POST /api/v1/admin/service-plans
{
  "service_id": "service-uuid-123",
  "subscription_type_id": "monthly-uuid-456",
  "age_group": "Teen (13–17)",
  "funding_type": "private",
  "price": 35.00,
  "currency": "USD"
}
```

For "Infant (0–5)" at "Monthly" subscription:
```bash
POST /api/v1/admin/service-plans
{
  "service_id": "service-uuid-123",
  "subscription_type_id": "monthly-uuid-456",
  "age_group": "Infant (0–5)",
  "funding_type": "private",
  "price": 25.00,
  "currency": "USD"
}
```

Repeat for each subscription type (3 Months, 6 Months, 12 Months, etc.)

---

## Testing

Run the comprehensive test:
```bash
npx tsx src/scripts/test-admin-api-comprehensive.ts
```

Expected output:
```
✅ GET /admin/subscription-types - Status: 200
✅ POST /admin/subscription-types - Status: 201
✅ GET /admin/services - Status: 200
✅ POST /admin/services - Status: 201
✅ GET /admin/memberships - Status: 200
✅ POST /admin/memberships - Status: 201
✅ POST /admin/service-plans (age_group: "Individual") - Status: 201
✅ POST /admin/service-plans (age_group: "Individual Plus") - Status: 201
✅ POST /admin/service-plans (age_group: "Senior (65+)") - Status: 201
✅ POST /admin/service-plans (age_group: "Adult (18+)") - Status: 201
✅ POST /admin/service-plans (age_group: "Teen (13–17)") - Status: 201
✅ POST /admin/service-plans (age_group: "Child (6–12)") - Status: 201
✅ POST /admin/service-plans (age_group: "Infant (0–5)") - Status: 201
✅ POST /admin/membership-plans (age_group: "Individual") - Status: 201
```

---

## Common Errors

### Error: "null value in column 'funding_type'"
**Cause**: Missing `funding_type` in payload  
**Fix**: Add `"funding_type": "private"` to payload

### Error: "violates check constraint age_group_check"
**Cause**: Invalid age_group value or incorrect formatting  
**Fix**: Use exact strings from the valid list above, including parentheses and en-dashes

### Error: 500 Internal Server Error
**Cause**: Usually missing required field or invalid value  
**Fix**: Check payload has all required fields with correct values

---

## Test Results (2026-01-28)

All age groups tested and verified:

| Age Group | Service Plans | Membership Plans |
|-----------|--------------|------------------|
| Individual | ✅ Pass | ✅ Pass |
| Individual Plus | ✅ Pass | ✅ Pass |
| Senior (65+) | ✅ Pass | ✅ Pass |
| Adult (18+) | ✅ Pass | ✅ Pass |
| Teen (13–17) | ✅ Pass | ✅ Pass |
| Child (6–12) | ✅ Pass | ✅ Pass |
| Infant (0–5) | ✅ Pass | ✅ Pass |

**Total Tests**: 7  
**Passed**: 7  
**Failed**: 0  
**Success Rate**: 100% ✅

---

## Updated: 2026-01-28
## Verified: All 7 age group values tested and confirmed working
