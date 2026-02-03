# Project Context & Coding Rules

## Conversation History & "Brains"
This file serves as a persistent context brain for the project, capturing key decisions and reusable components.

### Admin UI Redesign (formerly Conversation "Admin UI Redesign")
- **Dropdown Logic**: The exact logic for Age Group and Subscription Term dropdowns/displays is implemented in `src/pages/Services/Services.tsx`.
- **Reusable Data**: `AgeProfiles` and `SubscriptionTerms` in `src/pages/Settings/` are the source of truth for these configurations.
- **Display Rules**:
  - **Age Groups**: Always display as `Name (Min-Max)`.
  - **Subscription Terms**: Always display as `Name (Payment Mode)`.

## Future Access
If required, future modifications to these pricing matrices should respect the established pattern in `Services.tsx`.
