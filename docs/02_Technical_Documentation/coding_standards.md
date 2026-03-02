# Coding Standards (Frontend)

This document defines the coding standards and best practices for the Solar Swim Gym React/Vite Frontend project. All new code must adhere to these patterns to ensure consistency across the application.

---

## 1. General Principles

- **TypeScript Only**: All new files must be written in TypeScript (`.ts` or `.tsx`).
- **ES6+ Features**: Use modern JavaScript features (destructuring, arrow functions, template literals).
- **React Hooks**: Use functional components with hooks. Avoid class components.
- **Naming Conventions**:
  - **Components**: `PascalCase.tsx` (e.g., `Button.tsx`, `AccountDetail.tsx`).
  - **Hooks**: `camelCase.ts` with a `use` prefix (e.g., `useAuth.ts`, `useOutsideClick.ts`).
  - **Services/Utils**: `camelCase.ts` (e.g., `authService.ts`, `formatDate.ts`).
  - **Interfaces/Types**: `PascalCase` (e.g., `UserProfile`, `InvoiceData`).
- **Styling**: Prefer Material UI (MUI) components for consistent design language, supplemented by modular/custom CSS or Tailwind utility classes where necessary.

---

## 2. Layered Architecture

The application follows a modular and layered architecture within `src/`:

### 1. Presentation Layer (`src/pages/` and `src/components/`)
- **Pages**: Top-level views containing layout wrappers and routing logic.
- **Components**: Reusable UI elements (e.g., buttons, modals, input fields). Keep these highly cohesive and decoupled from business logic.

### 2. State Management (`src/context/` and Hooks)
- Utilize React Context (e.g., `AuthContext`, `LocationContext`) for global application state (like user session or selected location).
- Use local state (`useState`, `useReducer`) when state does not need to be shared globally.

### 3. Service Layer (`src/services/`)
- Encapsulate all API interactions and asynchronous data fetching.
- Components should never make raw `fetch` or `axios` calls directly; they must import a service method instead.
- Centralize request/response formatting, error handling, and authorization headers in `apiClient.ts` or the service layer.

---

## 3. Implementation Patterns

### Component Standard Template
```tsx
import React, { useState, useEffect } from 'react';
import { fetchUserProfile } from '../services/accountService';
import { UserProfile } from '../types/users';
import { Box, Typography, CircularProgress } from '@mui/material';

interface UserProfileProps {
  userId: string;
}

export const UserProfileView: React.FC<UserProfileProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchUserProfile(userId);
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!profile) return null;

  return (
    <Box>
      <Typography variant="h5">{profile.firstName} {profile.lastName}</Typography>
    </Box>
  );
};
```

### Service Standard Template
```typescript
import { apiClient } from './apiClient';
import { UserProfile } from '../types/users';

/**
 * Service generic structure for API calls.
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const response = await apiClient.get<UserProfile>(`/accounts/profiles/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    throw new Error(error.response?.data?.message || 'Network error occurred');
  }
};
```

---

## 4. Error Handling & State

- **Loading States**: Always show clear loading indicators (e.g., spinners, skeleton screens) while fetching data async.
- **Empty States**: Display user-friendly placeholder messages when lists/arrays are deliberately empty.
- **Error Feedback**: Use Toast notifications (e.g., via `react-toastify` or MUI `Snackbar`) to display non-blocking errors, and inline error text for form validation.
- **Try/Catch Blocks**: Wrap all `async` operations in `try/catch` blocks within useEffects or event handlers.

---

## 5. Security & Context

- **Token Storage**: Manage authentication tokens securely. Read/write tokens via context/storage wrappers rather than direct `localStorage` wherever possible.
- **Route Protection**: Use Higher-Order Components or layout wrappers (e.g., `ProtectedRoute`) to guard routes matching specific user roles or authentication states.
- **Location Isolation**: When performing administrative actions, attach the globally selected `location_id` (from Context) to requests seamlessly via the service layer.
