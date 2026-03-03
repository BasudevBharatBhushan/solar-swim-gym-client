# API: CRM (Leads, Accounts, Profiles)

**Base URL**: `/api/v1`

## 6.1 Leads
Management of potential customers and prospects.

### **GET** `/leads/search`
- **Purpose**: Query leads using Elasticsearch (default) or DB.
- **Query Params**:
  - `q`: Search string.
  - `elastic`: `true | false` (Default true).
  - `from`, `size`, `sort`, `order`.
- **Response**:
  ```json
  {
    "total": 50,
    "hits": [
      {
        "lead_id": "uuid",
        "first_name": "Jane",
        "last_name": "Lead",
        "email": "jane@leads.com",
        "status": "NEW",
        "created_at": "..."
      }
    ]
  }
  ```

### **POST** `/leads/bulk/csv`
- **Purpose**: Import leads via CSV.
- **Form-Data**: `file` (CSV).
- **Supported Headers**: `first_name, last_name, email, mobile, notes, status, source`.
- **Response**:
  ```json
  {
    "message": "Successfully processed 15 leads from CSV",
    "count": 15,
    "leads": [...]
  }
  ```

---

## 6.2 Accounts & Profiles
Management of registered families (Accounts) and individual members (Profiles).

### **GET** `/accounts/search`
- **Purpose**: Flexible search across account and profile metadata.
- **Response**:
  ```json
  {
    "total": 100,
    "hits": [
      {
        "account_id": "uuid",
        "status": "ACTIVE",
        "profiles": [
          { "profile_id": "uuid", "first_name": "John", "is_primary": true }
        ]
      }
    ]
  }
  ```

### **GET** `/accounts/:accountId`
- **Purpose**: Fetch full account details including all family profiles.
- **Response**:
  ```json
  {
    "account_id": "uuid",
    "location_id": "uuid",
    "status": "ACTIVE",
    "profiles": [
      {
        "profile_id": "uuid",
        "first_name": "John",
        "last_name": "Doe",
        "is_primary": true,
        "date_of_birth": "...",
        "waiver_program": { "name": "RCBE" }
      }
    ]
  }
  ```

### **POST** `/accounts/upsert`
- **Purpose**: Update account and link/create profiles.
- **Payload**:
  ```json
  {
    "account_id": "uuid",
    "primary_profile": { "profile_id": "optional", "first_name": "...", "email": "..." },
    "family_members": [ { "first_name": "...", "date_of_birth": "..." } ]
  }
  ```

---

## 6.3 Maintenance
### **POST** `/cron/reindex-all`
- **Purpose**: Force sync DB data to Elasticsearch.
- **Response**: `{ "message": "All data reindexing started" }`
