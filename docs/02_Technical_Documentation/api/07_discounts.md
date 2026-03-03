# API: Discounts & Promotions

**Base URL**: `/api/v1`

## 8.1 Discount Codes
Management of marketing codes and price reductions.

### **GET** `/discounts`
- **Purpose**: Fetch all discount codes for the location.
- **Response**:
  ```json
  [
    {
      "discount_id": "uuid",
      "discount_code": "WINTER20",
      "discount": "20% | 20",
      "discount_category": "MEMBERSHIP | SERVICE",
      "is_active": true,
      "start_date": "2024-01-01",
      "end_date": "2024-04-01",
      "applicable_refs": [
        { "id": "uuid", "reference_id": "service_uuid_or_plan_uuid" }
      ]
    }
  ]
  ```

### **POST** `/discounts`
- **Purpose**: Create or Update a discount code.
- **Payload**:
  ```json
  {
    "discount_id": "optional-uuid",
    "location_id": "uuid",
    "discount_code": "WINTER20",
    "discount": "20%",
    "discount_category": "SERVICE",
    "is_active": true,
    "applicable_refs": [
      { "reference_id": "uuid" }
    ]
  }
  ```

### **GET** `/discounts/validate/:code`
- **Purpose**: Validate a code for usage.
- **Response** (200 OK):
  ```json
  {
    "discount_id": "uuid",
    "discount_code": "WINTER20",
    "discount": "20%",
    "applicable_refs": [...]
  }
  ```
- **Response** (404 Not Found): `{ "error": "Invalid or expired discount code" }`

### **DELETE** `/discounts/:id`
- **Purpose**: Remove a discount code.
