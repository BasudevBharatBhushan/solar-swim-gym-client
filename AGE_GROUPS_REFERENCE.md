# Quick Reference: Age Groups

## ✅ Valid Age Group Values

Use these **EXACT** strings in your API calls:

```
Individual
Individual Plus
Senior (65+)
Adult (18+)
Teen (13–17)
Child (6–12)
Infant (0–5)
```

## ⚠️ Important

- **Case-sensitive**: Must match exactly
- **Include parentheses**: `(65+)`, `(18+)`, etc.
- **Use en-dash (–)**: Not regular hyphen (-)
- **No abbreviations**: Use full strings

## ❌ Don't Use These (Old Values)

```
adult
child
senior
teen
individual
individual_plus
senior_65_plus
```

## ✅ Example Payload

```json
{
  "service_id": "uuid",
  "subscription_type_id": "uuid",
  "age_group": "Individual",
  "funding_type": "private",
  "price": 50.00,
  "currency": "USD"
}
```

## 🧪 Test All Values

```bash
npx tsx src/scripts/test-admin-api-comprehensive.ts
```

All 7 values are tested and verified working! ✅
