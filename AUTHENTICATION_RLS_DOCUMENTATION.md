# Authentication & RLS Implementation Documentation

## Overview

This document explains the authentication system and Row-Level Security (RLS) implementation for the Solar Swim Gym backend.

## Authentication Flow

### User Registration & Activation

1. **Registration** (`POST /api/v1/auth/user/register`)
   - Creates an `account` record with status='PENDING'
   - Creates a primary `profile` record (without password)
   - Generates an activation token (expires in 24 hours)
   - Sends activation email (currently logged to console)
   - Returns activation token for testing

2. **Activation** (`POST /api/v1/auth/user/activate`)
   - Validates the activation token
   - Sets the user's password (bcrypt hashed)
   - Updates account status to 'ACTIVE'
   - Marks token as used

3. **Login** (`POST /api/v1/auth/user/login`)
   - Validates email and password
   - Checks account is ACTIVE
   - Returns JWT token with location_id

### Staff Authentication

1. **Login** (`POST /api/v1/auth/staff/login`)
   - Validates email and password
   - Checks staff is_active status
   - Returns JWT token with location_id and role

## JWT Token Structure

Both user and staff tokens contain:
```json
{
  "location_id": "uuid",
  "type": "staff" | "user",
  // For staff:
  "staff_id": "uuid",
  "role": "SUPERADMIN" | "ADMIN" | "STAFF",
  // For users:
  "profile_id": "uuid",
  "account_id": "uuid",
  "exp": timestamp
}
```

## Location Context Middleware

### How It Works

1. **optionalAuth Middleware** (runs first)
   - Extracts JWT token from Authorization header
   - Decodes and validates token
   - Sets `req.user` with token payload

2. **setLocationContext Middleware** (runs second)
   - Extracts location_id from:
     1. `x-location-id` header (priority)
     2. Request body `location_id`
     3. JWT token `req.user.location_id`
   - Stores in `req.locationId` for use in services

### Usage in Services

Services can access the location context via:
```typescript
const locationId = (req as any).locationId;
```

## Row-Level Security (RLS)

### Current Implementation

All tables have RLS enabled with policies like:
```sql
CREATE POLICY "Location Isolation" ON table_name
    USING (location_id = current_setting('app.current_location_id', true)::uuid);
```

### Important Limitation

**The Supabase JS client does NOT support setting PostgreSQL session variables.**

This means `current_setting('app.current_location_id')` will always return NULL when using the Supabase JS client.

### Solutions

#### Current Approach (Recommended for Development)

1. **Use Service Role Key** - Bypasses RLS entirely
   - Set in `.env` as `SUPABASE_KEY`
   - Gives full database access
   - Security is handled at application level

2. **Manual Filtering** - Add `.eq('location_id', locationId)` to queries
   ```typescript
   const { data } = await supabase
     .from('table')
     .select('*')
     .eq('location_id', locationId);  // Manual filter
   ```

#### Production Approaches

1. **Use Supabase Auth** instead of custom JWT
   - Supabase Auth can set user metadata
   - RLS policies can use `auth.uid()` and `auth.jwt()`

2. **Use PostgreSQL Functions (RPC)**
   - Create functions that set session variables
   - Call via `supabase.rpc()`
   - More complex but maintains RLS

3. **Use PostgREST Directly** (not Supabase JS)
   - Can set custom headers that PostgREST converts to session variables
   - Requires custom configuration

### Tables Without RLS

For security and functionality, these tables have RLS disabled:

- `account_activation_tokens` - Tokens are meant to be publicly accessible (sent via email)
  - Protected by: UUID (hard to guess), expiration, one-time use

### RLS Status by Table

| Table | RLS Enabled | Policy | Notes |
|-------|-------------|--------|-------|
| `location` | ✅ | Location Isolation | |
| `account` | ✅ | Location Isolation | |
| `profile` | ✅ | Location Isolation | |
| `account_activation_tokens` | ❌ | None | Disabled for Supabase client compatibility |
| `waiver_program` | ✅ | Location Isolation | |
| `subscription_term` | ✅ | Location Isolation | |
| `service` | ✅ | Location Isolation | |
| `base_pricing` | ✅ | Location Isolation | |
| `membership` | ✅ | Location Isolation | |
| `subscription` | ✅ | Location Isolation | |
| `invoice` | ✅ | Location Isolation | |
| `staff` | ✅ | Staff Visibility | Superadmin sees all |
| `leads` | ✅ | Location Isolation | |

## API Testing

### Test Scripts

1. **All APIs** - `npm test`
   - Tests all endpoints
   - Creates test data
   - Verifies responses

2. **Auth Flow** - `npm run test:auth`
   - Tests complete registration flow
   - Tests activation process
   - Tests login for users and staff

### Debug Endpoints

- `POST /api/v1/auth/user/get-activation-token` - Get activation token by email (testing only)

## Security Considerations

### Current Setup (Development)

- ✅ Passwords are bcrypt hashed
- ✅ JWT tokens expire after 24 hours
- ✅ Activation tokens expire after 24 hours
- ✅ Activation tokens are one-time use
- ⚠️ Using service role key (bypasses RLS)
- ⚠️ Activation tokens returned in API response (should only be via email)

### Production Recommendations

1. **Email Integration**
   - Remove `activation_token` from registration response
   - Send tokens only via email
   - Use proper email service (configured in `.env`)

2. **RLS Implementation**
   - Switch to Supabase Auth OR
   - Implement RPC functions for session variables OR
   - Use manual filtering with service role key

3. **Environment Variables**
   - Use strong `JWT_SECRET`
   - Rotate keys regularly
   - Use separate keys for dev/staging/production

4. **Rate Limiting**
   - Add rate limiting to auth endpoints
   - Prevent brute force attacks

5. **HTTPS Only**
   - Ensure all traffic is over HTTPS
   - Set secure cookie flags

## Environment Variables

Required in `.env`:
```
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
JWT_SECRET=your-secret-key

# Email (for activation emails)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
```

## Migration Path

To apply the RLS fix:
```sql
-- Run this SQL in your Supabase SQL editor:
-- File: sql/10_fix_rls_for_supabase_client.sql

ALTER TABLE account_activation_tokens DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Location Isolation via Account" ON account_activation_tokens;
```

## Future Enhancements

1. **Email Service Integration**
   - Implement actual email sending
   - Use templates for activation emails
   - Add email verification

2. **Password Reset Flow**
   - Similar to activation flow
   - Generate reset tokens
   - Send via email

3. **Multi-Factor Authentication**
   - SMS or authenticator app
   - Backup codes

4. **Session Management**
   - Track active sessions
   - Allow users to revoke sessions
   - Device management

5. **Audit Logging**
   - Log all authentication attempts
   - Track suspicious activity
   - Alert on anomalies
