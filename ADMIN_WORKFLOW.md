# Admin Settings Workflow

## Service Plan Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN SETTINGS PAGE                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Membership   │  │   Service    │  │ Subscription │          │
│  │ Management   │  │  Management  │  │    Types     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘

## SERVICE MANAGEMENT WORKFLOW

Step 1: Create Service
┌──────────────────────────────────────┐
│  Add New Service Form                │
│  ┌────────────────────────────────┐  │
│  │ Service Name: [Swimming Class] │  │
│  │ ☑ Active                       │  │
│  │ [Create Service]               │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
           │
           ▼
    POST /admin/services
    {
      "service_name": "Swimming Class",
      "is_active": true
    }
           │
           ▼
    Returns: service_id


Step 2: Set Pricing (Auto-fill Example)
┌────────────────────────────────────────────────────────────────┐
│  Pricing Matrix for: Swimming Class                            │
│                                                                  │
│  Category        │ 1 month │ 3 months │ 6 months │ 12 months  │
│  ────────────────┼─────────┼──────────┼──────────┼────────────│
│  Individual      │  $50 ←  │  $150    │  $300    │  $600      │
│                  │  USER   │  AUTO    │  AUTO    │  AUTO      │
│                  │  ENTERS │  FILLED  │  FILLED  │  FILLED    │
│  ────────────────┼─────────┼──────────┼──────────┼────────────│
│  Individual Plus │  $60    │  $180    │  $360    │  $720      │
│  Senior 65+      │  $45    │  $135    │  $270    │  $540      │
│  Add 18yr+       │  $55    │  $165    │  $330    │  $660      │
│  13yr–17yr       │  $40    │  $120    │  $240    │  $480      │
│  6mo–12yr        │  $35    │  $105    │  $210    │  $420      │
│                                                                  │
│  [Save Changes]                                                 │
└────────────────────────────────────────────────────────────────┘
           │
           ▼
    For each cell with a value:
    POST /admin/service-plans
    {
      "service_id": "uuid",
      "subscription_type_id": "uuid",
      "age_group": "individual",      ← Mapped from UI label
      "funding_type": "private",
      "price": 50.00,
      "currency": "USD"
    }


## AGE GROUP MAPPING

UI Display          →    Backend Value
─────────────────────────────────────────
Individual          →    individual
Individual Plus     →    individual_plus
Senior 65+          →    senior_65_plus
Add 18yr+           →    add_18_plus
13yr–17yr           →    teen_13_17
6mo–12yr            →    child_6mo_12yr


## AUTO-FILL LOGIC

When user enters price in 1-month column:
┌──────────────────────────────────────────────┐
│  1. Detect: billing_interval_unit = 'month'  │
│            billing_interval_count = 1        │
│                                              │
│  2. For each other subscription type:       │
│     - Check if target cell is empty         │
│     - Calculate: price × interval_count     │
│     - Fill the cell                         │
│                                              │
│  3. User can still modify any cell          │
└──────────────────────────────────────────────┘

Example:
  1 month  = $50  (user enters)
  3 months = $50 × 3 = $150  (auto-filled)
  6 months = $50 × 6 = $300  (auto-filled)
  12 months = $50 × 12 = $600  (auto-filled)


## INDIVIDUAL MODIFICATION

Scenario: User wants different pricing strategy
┌────────────────────────────────────────────┐
│  1. Enter 1-month: $50                     │
│     → Auto-fills: 3mo=$150, 6mo=$300       │
│                                            │
│  2. User manually changes 6-month to $250  │
│     → 6-month now shows $250               │
│     → 3-month still shows $150             │
│                                            │
│  3. User enters new 1-month: $55           │
│     → 6-month stays $250 (already set)     │
│     → 3-month stays $150 (already set)     │
│     → Only empty cells get auto-filled     │
└────────────────────────────────────────────┘


## ERROR HANDLING

Common Errors and Solutions:
┌─────────────────────────────────────────────────────────────┐
│  Error: 500 Internal Server Error                          │
│  Cause: Missing service_id or invalid age_group            │
│  Solution: ✅ Fixed - service_id now included in payload   │
│           ✅ Fixed - age_group properly mapped             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Error: Age group not recognized                           │
│  Cause: Using UI label instead of backend value            │
│  Solution: ✅ Fixed - automatic mapping implemented        │
│           "Individual" → "individual"                       │
└─────────────────────────────────────────────────────────────┘


## MEMBERSHIP MANAGEMENT (Similar Flow)

Step 1: Create Membership
┌──────────────────────────────────────┐
│  Add New Membership Form             │
│  ┌────────────────────────────────┐  │
│  │ Name: [Gold Pass]              │  │
│  │ Description: [Premium access]  │  │
│  │ ☑ Active                       │  │
│  │ [Create Membership]            │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
           │
           ▼
    POST /admin/memberships
           │
           ▼
    Returns: membership_id


Step 2: Set Pricing (same as service)

Step 3: Bundle Services
┌────────────────────────────────────────────┐
│  Bundled Services                          │
│                                            │
│  ☑ Swimming Class        [CORE] [ADDON]   │
│  ☑ Gym Access            [CORE] [ADDON]   │
│  ☐ Personal Training     [CORE] [ADDON]   │
│                                            │
│  CORE = Included in membership             │
│  ADDON = Optional, charges apply           │
└────────────────────────────────────────────┘
