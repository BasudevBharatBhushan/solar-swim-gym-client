# Profile List View Update

## Overview
Updated the profile list view to display all profile information from the new API response structure in a comprehensive table format with expandable details for case manager and guardian information.

## Changes Made

### 1. Type Definitions (`src/types/admin.types.ts`)
Updated `AdminProfile` interface to include all fields from the new API response:

```typescript
export interface AdminProfile {
  id?: string; // For backward compatibility
  profile_id: string; // Primary ID from backend
  account_id: string;
  parent_profile_id: string | null;
  first_name: string;
  last_name: string;
  name?: string; // Computed field: first_name + last_name
  date_of_birth: string;
  email: string | null;
  mobile?: string;
  role: 'HEAD' | 'CHILD' | 'Primary';
  rceb_flag: boolean;
  is_rceb?: boolean; // Alias for rceb_flag
  case_manager_name: string | null;
  case_manager_email: string | null;
  guardian_name: string | null;
  guardian_phoneno: string | null;
  is_active: boolean;
  created_at: string;
  // Optional UI-specific fields
  children?: AdminProfile[];
  plan?: string;
  services?: string[];
  paymentTenure?: string;
  expiryDate?: string;
}
```

### 2. Profile List View (`src/pages/admin/views/ProfilesView.tsx`)

#### Complete Redesign:
Replaced the hierarchical tree view with a comprehensive table-based layout showing all profile information.

#### New Table Columns:
1. **Name**: Full name with truncated profile ID
2. **Contact**: Email and mobile number
3. **Role**: HEAD/CHILD badge with color coding
4. **Age / DOB**: Calculated age and formatted date of birth
5. **Status**: Active/Inactive status + RCEB badge
6. **Created**: Formatted creation date

#### New Features:
1. **Expandable Rows**: Click on profiles with case manager or guardian info to expand
2. **Age Calculation**: Automatically calculates age from date of birth
3. **Date Formatting**: User-friendly date display (e.g., "Jan 28, 2026")
4. **Status Badges**: 
   - Green for Active, Gray for Inactive
   - Purple badge for RCEB clients
   - Indigo for HEAD/Primary roles, Orange for CHILD roles
5. **Expandable Details Cards**:
   - Case Manager card (blue icon) with name and email
   - Guardian card (green icon) with name and phone number

#### Helper Functions:
- `toggleProfileExpansion(profileId)`: Toggles expansion state
- `formatDate(dateString)`: Formats dates in readable format
- `calculateAge(dob)`: Calculates age from date of birth

#### UI Improvements:
- **Sortable Columns**: Click on "Name" or "Created" headers to sort
- **Chevron Indicator**: Shows when profile has additional info to expand
- **Responsive Cards**: Case manager and guardian info in responsive grid
- **Hover Effects**: Smooth transitions on row hover
- **Empty States**: Clear messaging when no profiles found

## API Response Structure
The component now expects profiles with this structure:
```json
{
  "profile_id": "uuid",
  "account_id": "uuid",
  "parent_profile_id": "uuid or null",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "2015-08-20",
  "email": "john@example.com or null",
  "role": "HEAD or CHILD",
  "rceb_flag": false,
  "case_manager_name": "Jane Smith or null",
  "case_manager_email": "jane@example.com or null",
  "guardian_name": "Parent Name or null",
  "guardian_phoneno": "+1234567890 or null",
  "is_active": true,
  "created_at": "2026-01-28T13:13:33.20885+00:00"
}
```

## Data Mapping
The component automatically maps the API response:
- Sets `id` field from `profile_id` for backward compatibility
- Computes `name` field from `first_name` + `last_name`
- Maps `is_rceb` from `rceb_flag`

## Display Logic

### Role Display:
- **HEAD/Primary**: Indigo badge
- **CHILD**: Orange badge

### Status Display:
- **Active**: Green badge
- **Inactive**: Gray badge
- **RCEB Client**: Purple badge (shown when `rceb_flag` is true)

### Expandable Content:
- Only profiles with case manager or guardian information show the chevron icon
- Clicking the row toggles the expansion
- Expanded view shows cards in a responsive grid (1 column on mobile, 2 on desktop)

### Age Calculation:
- Automatically calculates age from `date_of_birth`
- Handles edge cases (birthdays not yet occurred this year)
- Falls back to "-" if date is invalid

### Date Formatting:
- Displays dates in format: "Jan 28, 2026"
- Falls back to original string if parsing fails

## User Experience

1. **Quick Scan**: Table format allows quick scanning of all profile information
2. **Detailed View**: Click to expand for case manager and guardian details
3. **Visual Hierarchy**: Color-coded badges for quick identification
4. **Age Display**: Shows both age and DOB for context
5. **Contact Info**: Email and mobile displayed together
6. **Status at a Glance**: Multiple status indicators (active, RCEB) visible immediately

## Backward Compatibility
The component maintains compatibility with older API responses:
- Falls back to computed name if not provided
- Handles missing optional fields gracefully
- Uses profile_id or id interchangeably
