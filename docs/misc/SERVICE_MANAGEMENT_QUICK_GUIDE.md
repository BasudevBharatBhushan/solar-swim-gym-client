# Service Management - Quick Reference Guide

## Creating a New Service

### Step-by-Step:

1. **Navigate to Service Management**
   - Go to Settings → Service Management

2. **Click "Add New Service"**
   - Opens the service creation dialog

3. **Fill Basic Information**
   - **Service Name**: Enter a descriptive name (e.g., "Swimming Lesson")
   - **Service Type**: Select from dropdown
     - Class
     - Appointment
     - Facility Access
   - **Description**: Enter detailed description
   - **Is Addon Only**: Select Yes/No
     - No: Can be purchased standalone
     - Yes: Only available as an addon to other services

4. **Add Pricing Structure**
   - Click "Add Age Group Pricing" button
   - A new pricing row appears with:
     - **Age Group Dropdown**: Select which age group this pricing applies to
     - **Price Fields**: One field for each subscription term
       - Enter price for each term (e.g., Monthly: $50, Annual: $500)
   - Repeat to add pricing for multiple age groups

5. **Remove Pricing Rows** (if needed)
   - Click the red delete icon (🗑️) on any pricing row to remove it

6. **Save**
   - Click "Save" button
   - Service is created and appears in the table

## Editing an Existing Service

1. **Click Edit Icon** (✏️) on the service row
2. **Modify any fields** as needed
3. **Add/Remove pricing rows** using the buttons
4. **Change age group selection** in any pricing row
5. **Update prices** for any subscription term
6. **Click Save**

## Understanding the Pricing Structure

### Example Scenario:
You want to create a "Swimming Lesson" service with different prices for different age groups and subscription terms.

**Age Groups** (configured in Age Profiles):
- Kids (5-12 years)
- Teens (13-17 years)
- Adults (18+ years)

**Subscription Terms** (configured in Subscription Terms):
- Monthly (Recurring)
- Quarterly (Recurring)
- Annual (Pay in Full)

**Pricing Structure**:
```
Kids:
  - Monthly: $40
  - Quarterly: $110 (save $10)
  - Annual: $400 (save $80)

Teens:
  - Monthly: $45
  - Quarterly: $125
  - Annual: $450

Adults:
  - Monthly: $50
  - Quarterly: $140
  - Annual: $500
```

### How to Set This Up:

1. Click "Add Age Group Pricing" → Select "Kids"
   - Enter: Monthly = 40, Quarterly = 110, Annual = 400

2. Click "Add Age Group Pricing" → Select "Teens"
   - Enter: Monthly = 45, Quarterly = 125, Annual = 450

3. Click "Add Age Group Pricing" → Select "Adults"
   - Enter: Monthly = 50, Quarterly = 140, Annual = 500

4. Click Save

## Tips & Best Practices

### ✅ DO:
- Configure Age Groups and Subscription Terms BEFORE creating services
- Use descriptive service names
- Fill in all relevant pricing fields
- Test by creating a sample service first
- Delete unused pricing rows to keep data clean

### ❌ DON'T:
- Leave pricing fields empty (they will be ignored)
- Create duplicate pricing rows for the same age group
- Forget to select a location before managing services
- Use negative prices

## Common Issues & Solutions

### Issue: "No pricing rows added yet" message
**Solution**: Click "Add Age Group Pricing" to add your first pricing row

### Issue: Age group dropdown is empty
**Solution**: Go to Settings → Age Profiles and create age groups first

### Issue: No subscription terms showing in pricing fields
**Solution**: Go to Settings → Subscription Terms and create terms for your location

### Issue: Can't save service
**Solution**: 
- Ensure service name is filled
- Ensure location is selected
- Check browser console for errors

### Issue: Pricing doesn't appear after adding
**Solution**: Make sure you entered a price value and clicked Save

## Keyboard Shortcuts

- **Tab**: Navigate between fields
- **Enter**: Submit form (when focused on Save button)
- **Esc**: Close dialog without saving

## Data Validation

The system validates:
- ✓ Service name is required
- ✓ Service type is required
- ✓ Location must be selected
- ✓ Prices must be numbers (if provided)
- ✓ Age group IDs must be valid

## API Reference

For developers integrating with the API:

### Create/Update Service:
```http
POST /api/v1/services
Content-Type: application/json
Authorization: Bearer {token}

{
  "service_id": "uuid-or-undefined",
  "location_id": "uuid",
  "name": "Swimming Lesson",
  "description": "Group swimming lesson",
  "service_type": "class",
  "is_addon_only": false,
  "pricing_structure": [
    {
      "age_group_id": "uuid",
      "terms": [
        {
          "subscription_term_id": "uuid",
          "price": 50.00
        }
      ]
    }
  ]
}
```

### Get All Services:
```http
GET /api/v1/services
Authorization: Bearer {token}
x-location-id: {location-uuid}
```

## Support

For additional help:
- Check the main documentation: `SERVICE_MANAGEMENT_GUIDE.md`
- Review the Postman collection: `postman_collection.json`
- Contact system administrator
