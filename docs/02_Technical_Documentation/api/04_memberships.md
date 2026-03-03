# API: Membership Engine

**Base URL**: `/api/v1`

## 5.1 Membership Programs
A Membership Program (e.g., "Standard", "Silver", "Gold") contains categories, fees, and rules.

### **GET** `/memberships`
- **Purpose**: Fetch the full hierarchy of membership programs.
- **Response**:
  ```json
  [
    {
      "membership_program_id": "uuid",
      "name": "Gold Club",
      "status": "ACTIVE",
      "categories": [
        {
          "category_id": "uuid",
          "name": "Family",
          "fees": [
            { "id": "uuid", "fee_type": "JOINING", "amount": 100.00 }
          ],
          "rules": [
            { "id": "uuid", "rule_type": "MIN_MEMBERS", "rule_value": "3" }
          ]
        }
      ],
      "services": []
    }
  ]
  ```

### **GET** `/memberships/:id`
- **Purpose**: Detailed view of a single program.

### **POST** `/memberships`
- **Purpose**: Create or Update a program and its child entities (Categories, Fees, Rules).
- **Payload**:
  ```json
  {
    "membership_program_id": "optional-uuid",
    "location_id": "uuid",
    "name": "Silver Plan",
    "categories": [
      {
        "category_id": "optional-uuid",
        "name": "Individual",
        "fees": [
          { "fee_type": "ANNUAL", "amount": 50 }
        ],
        "rules": [
          { "rule_type": "AGE_RESTRICTION", "rule_value": "18+" }
        ]
      }
    ]
  }
  ```

---

## 5.2 Categories & Services
Manage standalone categories or included services.

### **GET** `/memberships/categories/:id`
- **Purpose**: Get detail for a specific category (useful for form editing).

### **DELETE** `/memberships/categories/:id`
- **Purpose**: Remove a category and all its associated fees and rules.
