# API: Authentication & Context

**Base URL**: `/api/v1`

## 1.1 Staff Authentication
Endpoints for internal staff and administrator access.

### **POST** `/auth/staff/login`
- **Purpose**: Authenticate admin/staff members.
- **Payload**:
  ```json
  {
    "email": "admin@solar.com",
    "password": "secret_password"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "token": "jwt_token_here",
    "staff": {
      "staff_id": "uuid",
      "location_id": "uuid",
      "email": "admin@solar.com",
      "first_name": "John",
      "last_name": "Smith",
      "role": "admin",
      "is_active": true
    }
  }
  ```

### **GET** `/auth/staff/all`
- **Purpose**: Fetch all staff across all locations.
- **Access**: SUPERADMIN.
- **Response**: List of staff objects.

---

## 1.2 Account/User Registration & Activation
Endpoints for family-based user registration and onboarding.

### **POST** `/auth/user/register`
- **Purpose**: Onboard a new family account.
- **Payload**: 
  ```json
  {
    "location_id": "uuid",
    "primary_profile": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@doe.com",
      "phone": "1234567890",
      "date_of_birth": "1990-01-01",
      "gender": "Male",
      "waiver_program_id": "uuid",
      "case_manager_name": "Mr. Manager",
      "password": "optional_if_setting_immediately"
    },
    "family_members": [
      {
        "first_name": "Jane",
        "last_name": "Doe",
        "date_of_birth": "2015-05-20",
        "gender": "Female",
        "waiver_program_id": "uuid"
      }
    ],
    "heard_about_us": "Social Media",
    "notify_primary_member": true,
    "notify_guardian": false,
    "staff_id": "optional_uuid",
    "staff_name": "optional_name"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "message": "Registration successful...",
    "account_id": "uuid",
    "profile_id": "uuid (primary)",
    "family_member_ids": ["uuid", "..."],
    "activation_token": "token_string"
  }
  ```

### **GET** `/auth/user/activate`
- **Query Params**: `token=activation_token`
- **Response**:
  ```json
  {
    "success": true,
    "account": { "account_id": "uuid", "email": "john@doe.com" }
  }
  ```

### **POST** `/auth/user/activate`
- **Payload**:
  ```json
  {
    "token": "activation_token",
    "password": "new_secure_password"
  }
  ```
- **Response**: `{ "success": true, "message": "Account activated successfully" }`

### **POST** `/auth/user/login`
- **Payload**: `{ "email": "john@doe.com", "password": "..." }`
- **Response**: Same as Staff Login but with User profile data.

---

## 1.3 Session Context (Location)

### **POST** `/auth/switch-location`
- **Purpose**: For superadmins to change their active location context.
- **Payload**: `{ "location_id": "uuid" }`
- **Response**: `{ "token": "new_jwt_with_updated_location_id" }`
