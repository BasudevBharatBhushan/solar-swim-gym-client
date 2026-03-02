# Change Management Rules (Frontend)

This document outlines the mandatory procedures and standards for making changes to the Solar Swim Gym React Client codebase. Following these rules ensures consistency, maintainability, and accurate documentation across the project.

---

## 1. Introducing New UI Features

Whenever a change requires adding a new page, feature, or substantial component, follow these steps:

### Step 1: Create Component/Page Structure
- For full pages, create a new directory inside `src/pages/` containing an `index.ts` export and the main `.tsx` file.
- For reusable UI parts, add them to `src/components/` (categorized logically, e.g., `/Dialogs`, `/Forms`).
- **Naming Convention:** Apply `PascalCase` to all `.tsx` component files.

### Step 2: Implement Routing
- If it's a new page accessible via URL, register the component in the application router (e.g., in `App.tsx` or `src/router`).
- Secure the route using wrapper components (like `ProtectedRoute`) if it requires authentication or specific staff roles.

### Step 3: Implement Local State & Effects
- Use hooks (`useState`, `useEffect`) thoughtfully. 
- Do not add complex business logic directly into the component's render function.

---

## 2. API Integration & Service Layer Changes

When the backend API changes (e.g., new routes, changed payload structure, new response fields), the frontend service layer must be updated:

### Step 1: Update TypeScript Definitions
- Modify or create new interfaces in `src/types/` to reflect the new API structures (Requests or Responses).
- Avoid using `any` type for API payloads; maintain strict typing.

### Step 2: Update the Service File
- Navigate to `src/services/` and locate the relevant service file (e.g., `accountService.ts`, `membershipService.ts`).
- Update or add the data fetching method using `apiClient`. Ensure it returns the correctly-typed Promise.

### Step 3: Update Components
- Ensure that any component relying on the updated service handles the new data gracefully.
- Update loading and error states if the specific service method's behavior has fundamentally changed.

### Step 4: Update API Client Documentation
- When creating a completely new service method, update `docs/02_Technical_Documentation/service_documentation.md` so that other developers know this endpoint is now supported by the frontend.

---

## 3. Global State Changes (Context)

When a feature impacts global data sharing (such as User Profiles, Selected Locations, or Cart Data):

### Step 1: Modifying Context Providers
- Go to `src/context/` and carefully modify the relevant Context (e.g., `AuthContext.tsx`).
- Ensure state updates within Context do not trigger unnecessary or infinite re-renders across the app.

### Step 2: Utilizing Custom Hooks
- Update the consuming custom hook carefully (e.g., `useAuth()`).
- Components should only extract what they directly need to optimize rendering performance.

---

## 4. Pull Request & Commit Rules

- **Linting:** Ensure all code is linted and adheres to frontend coding standards.
- **Console Logs:** Remove extraneous `console.log()` statements before committing. Use them only during active debugging.
- **Descriptive Commits:** Provide a clear description of what UI or Service Logic was changed and why. Reference any relevant task IDs or sprint goals.
