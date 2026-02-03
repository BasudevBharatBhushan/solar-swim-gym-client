# Service Management with Global Configuration Context

## Overview
This implementation provides a comprehensive service management system with dynamic pricing structure configuration. The key feature is a **global ConfigContext** that maintains age groups and subscription terms across the application, ensuring all dropdowns are always in sync.

## Key Features

### 1. **Global Configuration Context** (`ConfigContext.tsx`)
- **Purpose**: Centralized state management for age groups and subscription terms
- **Auto-refresh**: Automatically fetches data when location changes
- **Manual refresh**: Provides methods to refresh data after modifications
- **Benefits**: 
  - Single source of truth for configuration data
  - Eliminates duplicate API calls
  - Ensures UI consistency across components

### 2. **Service Management Component** (`ServiceManagement.tsx`)

#### Features:
- **Create/Edit Services**: Full CRUD operations for services
- **Dynamic Pricing Structure**: 
  - Add/remove age group pricing rows on demand
  - Each row has a dropdown to select age group
  - Each row displays all subscription terms with price inputs
  - Delete button to remove pricing rows
- **Service Fields**:
  - Name
  - Description
  - Service Type (Class, Appointment, Facility Access)
  - Is Addon Only (Yes/No)
  - Pricing Structure (dynamic rows)

#### Pricing Structure Format:
```json
{
  "pricing_structure": [
    {
      "age_group_id": "uuid-here",
      "terms": [
        {
          "subscription_term_id": "uuid-here",
          "price": 50.00
        }
      ]
    }
  ]
}
```

### 3. **Integration with Age Profiles & Subscription Terms**

Both `AgeProfiles.tsx` and `SubscriptionTerms.tsx` now:
- Use the global `ConfigContext`
- Call `refreshAgeGroups()` or `refreshSubscriptionTerms()` after save/add operations
- This ensures Service Management dropdowns are immediately updated

## How It Works

### Flow Diagram:
```
User modifies Age Group
    ↓
AgeProfiles component saves to API
    ↓
Calls refreshAgeGroups() from ConfigContext
    ↓
ConfigContext fetches latest age groups
    ↓
All components using useConfig() get updated data
    ↓
Service Management dropdowns automatically show new age group
```

### Adding a New Service:

1. Click "Add New Service" button
2. Fill in basic service details (name, description, type, addon status)
3. Click "Add Age Group Pricing" to add pricing rows
4. Select age group from dropdown (shows all available age groups from ConfigContext)
5. Enter prices for each subscription term (all terms shown from ConfigContext)
6. Add more pricing rows as needed
7. Click Save

### Editing a Service:

1. Click edit icon on service row
2. Dialog opens with existing data pre-filled
3. Modify any fields
4. Add/remove pricing rows using "Add Age Group Pricing" button or delete icons
5. Change age group selection in dropdown if needed
6. Update prices
7. Click Save

## API Integration

### Endpoints Used:
- `GET /config/age-groups` - Fetch all age groups
- `GET /config/subscription-terms` - Fetch subscription terms for location
- `POST /config/age-groups` - Create/update age group
- `POST /config/subscription-terms` - Create/update subscription term
- `GET /services` - Fetch all services for location
- `POST /services` - Create/update service (upsert)

### Service Payload Example:
```json
{
  "service_id": "uuid-or-undefined-for-new",
  "location_id": "uuid-here",
  "name": "Swimming Lesson",
  "description": "Group swimming lesson for beginners",
  "service_type": "class",
  "is_addon_only": false,
  "pricing_structure": [
    {
      "age_group_id": "age-group-uuid",
      "terms": [
        {
          "subscription_term_id": "term-uuid",
          "price": 50.00
        },
        {
          "subscription_term_id": "another-term-uuid",
          "price": 45.00
        }
      ]
    }
  ]
}
```

## Files Modified/Created

### Created:
- `src/context/ConfigContext.tsx` - Global configuration context

### Modified:
- `src/App.tsx` - Added ConfigProvider wrapper
- `src/pages/Settings/ServiceManagement.tsx` - Complete rewrite with dynamic pricing
- `src/pages/Settings/AgeProfiles.tsx` - Added ConfigContext integration
- `src/pages/Settings/SubscriptionTerms.tsx` - Added ConfigContext integration

## Benefits of This Approach

1. **Consistency**: All dropdowns across the app show the same data
2. **Real-time Updates**: Changes to age groups/terms immediately reflect everywhere
3. **Performance**: Reduces redundant API calls
4. **Maintainability**: Single source of truth for configuration
5. **User Experience**: Intuitive interface for managing complex pricing structures
6. **Flexibility**: Easy to add/remove pricing rows as needed

## Usage Tips

- Always ensure a location is selected before managing services
- Age groups and subscription terms must be configured before creating services
- The pricing structure is optional - you can create a service without pricing
- Use "Add Age Group Pricing" to dynamically add rows for different age groups
- Each age group can have different prices for different subscription terms
- Delete pricing rows using the red delete icon if no longer needed

## Future Enhancements

- Bulk pricing operations
- Copy pricing from one service to another
- Pricing templates
- Price history tracking
- Validation rules for pricing (e.g., min/max prices)
