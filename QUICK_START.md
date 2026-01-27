# Quick Start Guide - Admin Settings

## 🚀 Getting Started

### Prerequisites
- Admin account with valid credentials
- Backend API running on `http://localhost:3000`
- Frontend running on development server

---

## 📋 Step-by-Step Guide

### Part 1: Setting Up Subscription Types

1. **Navigate to Admin Settings**
   - Click on "Admin" in sidebar
   - Select "Settings"
   - Click "Subscription Types" tab

2. **Create Subscription Types**
   ```
   Example subscription types to create:
   
   ┌─────────────┬──────────┬───────┬────────────┐
   │ Name        │ Unit     │ Count │ Auto-Renew │
   ├─────────────┼──────────┼───────┼────────────┤
   │ Monthly     │ month    │ 1     │ ✓          │
   │ 3 Months    │ month    │ 3     │ ✗          │
   │ 6 Months    │ month    │ 6     │ ✗          │
   │ 12 Months   │ month    │ 12    │ ✓          │
   └─────────────┴──────────┴───────┴────────────┘
   ```

3. **Save Each Type**
   - Fill in the form
   - Click "Create Subscription Type"
   - Repeat for all types

---

### Part 2: Creating Services with Pricing

1. **Navigate to Service Management**
   - Click "Service Management" tab

2. **Create a Service**
   ```
   Example:
   Service Name: Swimming Lessons
   ☑ Active
   ```
   - Click "Create Service"

3. **Set Up Pricing (Smart Way!)**
   
   **Step 3a: Start with 1-Month Column**
   ```
   Enter prices in the 1-month column FIRST:
   
   Individual:       $50
   Individual Plus:  $60
   Senior 65+:       $45
   Add 18yr+:        $55
   13yr–17yr:        $40
   6mo–12yr:         $35
   ```

   **Step 3b: Watch the Magic! ✨**
   ```
   System auto-fills other columns:
   
   Category         │ 1 mo │ 3 mo  │ 6 mo  │ 12 mo
   ─────────────────┼──────┼───────┼───────┼───────
   Individual       │ $50  │ $150  │ $300  │ $600
   Individual Plus  │ $60  │ $180  │ $360  │ $720
   Senior 65+       │ $45  │ $135  │ $270  │ $540
   Add 18yr+        │ $55  │ $165  │ $330  │ $660
   13yr–17yr        │ $40  │ $120  │ $240  │ $480
   6mo–12yr         │ $35  │ $105  │ $210  │ $420
   ```

   **Step 3c: Adjust if Needed (Optional)**
   ```
   Want to offer a discount for 6-month commitment?
   
   Individual 6-month: Change $300 → $250
   
   The change is saved, other values stay the same!
   ```

4. **Save Changes**
   - Click "Save Changes" button
   - Wait for success message

---

### Part 3: Creating Memberships with Pricing

1. **Navigate to Membership Management**
   - Click "Membership Management" tab

2. **Create a Membership**
   ```
   Example:
   Membership Name: Gold Pass
   Description: Premium access to all facilities
   ☑ Active
   ```
   - Click "Create Membership"

3. **Set Up Pricing**
   - Same process as services
   - Start with 1-month column
   - Let auto-fill do the work
   - Adjust as needed

4. **Bundle Services**
   ```
   Select services to include:
   
   ☑ Swimming Lessons    → Mark as CORE
   ☑ Gym Access          → Mark as CORE
   ☑ Personal Training   → Mark as ADDON
   ```
   
   - **CORE**: Included in membership (no extra charge)
   - **ADDON**: Optional add-on (charges apply)

---

## 💡 Pro Tips

### Tip 1: Always Start with 1-Month
```
✓ DO:   Enter 1-month prices first
✗ DON'T: Start with 3-month or 6-month
```
Auto-fill only works when entering the 1-month base price.

### Tip 2: Bulk Entry Strategy
```
For multiple services with similar pricing:
1. Create all services first
2. Set pricing for first service
3. Note the pattern
4. Quickly replicate for others
```

### Tip 3: Use Consistent Pricing
```
Example pricing strategy:
- Base (1 month): $50
- 3 months: $150 (no discount)
- 6 months: $250 (16% discount)
- 12 months: $500 (17% discount)
```

### Tip 4: Test Before Going Live
```
1. Create test service
2. Set test prices
3. Verify in customer-facing UI
4. Delete test data
5. Create real services
```

---

## ⚠️ Common Mistakes to Avoid

### Mistake 1: Starting with Wrong Column
```
❌ Entering 3-month price first
   → Auto-fill won't work

✅ Enter 1-month price first
   → Auto-fill works perfectly
```

### Mistake 2: Forgetting to Save
```
❌ Making changes and navigating away
   → Changes lost

✅ Click "Save Changes" after editing
   → Changes persisted
```

### Mistake 3: Incorrect Age Groups
```
❌ Creating custom age groups
   → Not supported

✅ Use predefined age groups only
   → System validates correctly
```

---

## 🔍 Verification Checklist

After setting up, verify:

- [ ] All subscription types created
- [ ] Services created and active
- [ ] Pricing set for all age groups
- [ ] Pricing set for all subscription types
- [ ] Memberships created
- [ ] Services bundled correctly
- [ ] CORE vs ADDON marked correctly
- [ ] Changes saved successfully
- [ ] No error messages

---

## 🐛 Troubleshooting

### Problem: Auto-fill not working
**Solution**:
1. Make sure you're in the 1-month column
2. Check that other fields are empty
3. Verify subscription type is set to 1 month

### Problem: Save button disabled
**Solution**:
1. Make at least one change
2. Wait for previous save to complete
3. Check for error messages

### Problem: 500 Error
**Solution**:
1. Check browser console
2. Verify service is selected
3. Ensure all required fields filled
4. Contact support if persists

---

## 📊 Example: Complete Setup

### Scenario: Setting up a new gym

**Step 1: Create Subscription Types**
```
✓ Monthly (1 month, auto-renew)
✓ Quarterly (3 months)
✓ Semi-Annual (6 months)
✓ Annual (12 months, auto-renew)
```

**Step 2: Create Services**
```
✓ Gym Access
✓ Pool Access
✓ Group Classes
✓ Personal Training
```

**Step 3: Price Services**
```
Gym Access (1-month base):
- Individual: $50
- Individual Plus: $60
- Senior 65+: $40
- Others: $45

Auto-filled for other durations ✓
```

**Step 4: Create Memberships**
```
✓ Bronze Pass
  - Gym Access (CORE)
  
✓ Silver Pass
  - Gym Access (CORE)
  - Pool Access (CORE)
  
✓ Gold Pass
  - Gym Access (CORE)
  - Pool Access (CORE)
  - Group Classes (CORE)
  - Personal Training (ADDON)
```

**Step 5: Set Membership Pricing**
```
Bronze Pass (1-month base):
- Individual: $45 (5% discount vs standalone)
- Auto-filled for other durations ✓

Silver Pass (1-month base):
- Individual: $85 (15% discount vs standalone)
- Auto-filled for other durations ✓

Gold Pass (1-month base):
- Individual: $120 (20% discount vs standalone)
- Auto-filled for other durations ✓
```

**Result**: Complete gym setup in under 10 minutes! 🎉

---

## 📞 Need Help?

### Resources
- [FIX_SUMMARY.md](./FIX_SUMMARY.md) - Technical details
- [ADMIN_WORKFLOW.md](./ADMIN_WORKFLOW.md) - Visual workflows
- [BEFORE_AFTER.md](./BEFORE_AFTER.md) - Comparison guide

### Testing
Run the test script to verify API:
```bash
npx tsx src/scripts/test-admin-api-comprehensive.ts
```

### Support
If you encounter issues:
1. Check documentation above
2. Run test script
3. Check browser console
4. Verify API is running
5. Contact technical support

---

## ✅ Success Indicators

You'll know everything is working when:
- ✓ Auto-fill populates prices automatically
- ✓ Manual edits are preserved
- ✓ Save succeeds without errors
- ✓ Prices appear in customer-facing UI
- ✓ No console errors
- ✓ All age groups work correctly

---

**Happy configuring! 🎊**
