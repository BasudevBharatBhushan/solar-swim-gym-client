# Account List View Update

## Overview
Updated the account list view to display profile details from the new API response structure. The accounts now show the head member's name and can be expanded to view all family members.

## Changes Made

### 1. Type Definitions (`src/types/admin.types.ts`)
- Added `AccountProfile` interface to represent individual profile data:
  ```typescript
  export interface AccountProfile {
    profile_id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    parent_profile_id: string | null;
    headmember: boolean;
  }
  ```
- Updated `AdminAccount` interface to include:
  - `account_id` field (backend returns this)
  - `email` field (account email)
  - `profiles` array (optional array of AccountProfile)

### 2. Account List View (`src/pages/admin/views/AccountsView.tsx`)

#### New Features:
1. **Expandable Rows**: Click on any account row to expand/collapse family member details
2. **Head Member Display**: The first column now shows the head member's name (identified by `headmember: true`)
3. **Family Member Cards**: When expanded, family members are displayed in a responsive grid layout with:
   - Full name
   - Email (if available)
   - Truncated profile ID
   - User icon

#### New State:
- `expandedAccounts`: Set of account IDs that are currently expanded

#### New Helper Functions:
- `toggleAccountExpansion(accountId)`: Toggles the expansion state of an account
- `getHeadMember(account)`: Finds and returns the head member's name from the profiles array
- `getFamilyMembers(account)`: Returns all non-head members from the profiles array

#### UI Updates:
- **Column Header**: Changed from "Account Name" to "Head Member"
- **Chevron Icon**: Added rotating chevron icon to indicate expandable state
- **Member Count**: Now uses `account.profiles?.length` if available
- **Family Member Grid**: Responsive grid (1 column on mobile, 2 on tablet, 3 on desktop)
- **Empty State**: Shows "No additional family members" when account has no family members

## API Response Structure
The component now expects accounts with this structure:
```json
{
  "account_id": "uuid",
  "email": "family@demo.com",
  "status": "active",
  "created_at": "2026-01-28T13:13:33.20885+00:00",
  "profiles": [
    {
      "profile_id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@mail.com",
      "parent_profile_id": null,
      "headmember": true
    },
    {
      "profile_id": "uuid",
      "first_name": "Jane",
      "last_name": "Doe",
      "email": null,
      "parent_profile_id": "parent-uuid",
      "headmember": false
    }
  ]
}
```

## Backward Compatibility
The component maintains backward compatibility with the old API response format:
- Falls back to `primary_profile_name` if profiles array is not available
- Uses `total_members` if profiles array length is not available
- Handles missing email fields gracefully

## User Experience
1. **Click to Expand**: Users can click anywhere on an account row to expand it
2. **Visual Feedback**: Chevron icon rotates when expanded
3. **Hover Effects**: Rows and family member cards have hover effects
4. **Responsive Design**: Family member grid adapts to screen size
5. **Clear Hierarchy**: Head member is clearly distinguished from family members
