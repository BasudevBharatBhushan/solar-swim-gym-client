# API: Core Configuration & Reference Data

**Base URL**: `/api/v1`

## 2.1 Locations
Endpoints for managing branch information.

### **GET** `/locations` (Superadmin only)
- **Response**: List of Location objects.

### **POST** `/locations`
- **Purpose**: Create or Update a Location.
- **Payload**:
  ```json
  {
    "location_id": "optional-uuid",
    "name": "Solar Swim Gym North",
    "address": "123 Water St",
    "city": "Poolville",
    "state": "CA",
    "zip_code": "90210",
    "timezone": "America/Los_Angeles"
  }
  ```

---

## 2.2 Global Config: Age Groups
Defines categorization based on age for memberships and services.

### **GET** `/config/age-groups`
- **Response**:
  ```json
  [
    {
      "age_group_id": "uuid",
      "name": "Toddler",
      "min_age": 1,
      "max_age": 4,
      "age_group_category": "Membership",
      "is_recurring": true,
      "recurrence_unit": "month"
    }
  ]
  ```

### **POST** `/config/age-groups`
- **Payload**:
  ```json
  {
    "age_group_id": "optional-uuid",
    "location_id": "uuid",
    "name": "Toddler",
    "min_age": 1,
    "max_age": 4,
    "age_group_category": "Membership | Service"
  }
  ```

---

## 2.3 Global Config: Subscription Terms
Defines billing periods (e.g., Monthly, Quarterly).

### **GET** `/config/subscription-terms`
- **Response**:
  ```json
  [
    {
      "subscription_term_id": "uuid",
      "name": "Monthly",
      "duration_months": 1,
      "payment_mode": "RECURRING"
    }
  ]
  ```

---

## 2.4 Waiver Programs
Defines insurance or state-sponsored waiver programs (e.g., RCBE).

### **GET** `/config/waiver-programs`
- **Response**: 
  ```json
  [
    {
      "waiver_program_id": "uuid",
      "name": "RCBE",
      "code": "RCBE-01",
      "requires_case_manager": true
    }
  ]
  ```
