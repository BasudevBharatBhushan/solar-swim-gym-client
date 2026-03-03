# API: Service Catalog & Pricing

**Base URL**: `/api/v1`

## 4.1 Services
Endpoints for managing the catalog of services (Swims, Lessons, etc.).

### **GET** `/services`
- **Purpose**: Fetch all services available at the location.
- **Response**:
  ```json
  [
    {
      "service_id": "uuid",
      "location_id": "uuid",
      "name": "Swimming Lesson",
      "description": "Standard 30min lesson",
      "service_type": "LESSON",
      "type": "RECURRING",
      "is_addon_only": false,
      "is_active": true,
      "image_url": "https://...",
      "LessonRegistrationFee": 20.00
    }
  ]
  ```

### **POST** `/services`
- **Purpose**: Create or Update a service.
- **Payload**:
  ```json
  {
    "service_id": "optional-uuid",
    "location_id": "uuid",
    "name": "New Service",
    "description": "...",
    "service_type": "...",
    "type": "...",
    "is_addon_only": false,
    "is_active": true,
    "LessonRegistrationFee": 15.00
  }
  ```

### **POST** `/services/:id/image`
- **Purpose**: Upload a service image.
- **Form-Data**: `file` (Image)
- **Response**: `{ "success": true, "image_url": "..." }`

---

## 4.2 Base Pricing
Endpoints for root membership costs (Primary Member and family member base rates).

### **GET** `/base-prices`
- **Purpose**: Fetch the base rates for account roles.
- **Response**:
  ```json
  [
    {
      "base_price_id": "uuid",
      "name": "Primary Adult Monthly",
      "role": "PRIMARY",
      "age_group_id": "uuid",
      "subscription_term_id": "uuid",
      "price": 50.00,
      "subscription_term": { "name": "Monthly", "duration_months": 1 },
      "age_group": { "name": "Adult" }
    }
  ]
  ```

### **POST** `/base-prices`
- **Purpose**: Upsert a base price record.
- **Payload**:
  ```json
  {
    "base_price_id": "optional-uuid",
    "location_id": "uuid",
    "name": "...",
    "role": "PRIMARY | ADD_ON",
    "age_group_id": "uuid",
    "subscription_term_id": "uuid",
    "price": 29.99
  }
  ```

---

## 4.3 Membership Services
Internal mappings for services included in global plans.

### **GET** `/membership-services/base-plan`
- **Response**: List of services that come standard with a basic account.

### **POST** `/membership-services/upsert`
- **Payload**: `{ "service_id": "uuid", "is_part_of_base_plan": true, ... }`
