# API Integration Guide

This guide explains how to use the backend API in your React components.

## Quick Start

### 1. Import the API service

```typescript
import api from '../services/api.service';
```

### 2. Use in your components

```typescript
// Example: Login
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await api.auth.login({ email, password });
    console.log('Logged in:', response.profile);
    // Token is automatically stored in localStorage
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

---

## API Usage Examples

### Authentication

#### Login
```typescript
import api from '../services/api.service';

const login = async () => {
  try {
    const response = await api.auth.login({
      email: 'john.doe@example.com',
      password: 'securePassword123'
    });
    
    console.log('Access Token:', response.accessToken);
    console.log('Profile:', response.profile);
    
    // Token is automatically saved to localStorage
    // All subsequent API calls will include this token
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

#### Logout
```typescript
import api from '../services/api.service';

const logout = () => {
  api.auth.logout();
  // Clears token from localStorage
  // Redirect to login page
};
```

---

### Onboarding

#### Complete Onboarding
```typescript
import api from '../services/api.service';
import type { OnboardingRequest } from '../types/api.types';

const completeOnboarding = async () => {
  const onboardingData: OnboardingRequest = {
    primary_profile: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'securePassword123',
      mobile: '555-0123',
      date_of_birth: '1985-05-15',
      rceb_flag: true,
      case_manager: {
        name: 'Jane Smith',
        email: 'jane.smith@rceb.org'
      }
    },
    family_members: [
      {
        first_name: 'Child',
        last_name: 'One',
        date_of_birth: '2018-02-10',
        email: 'child1@example.com',
        rceb_flag: false,
        services: ['5cd7c77b-9066-47a6-9bc9-cfbac0998fee']
      }
    ]
  };

  try {
    const response = await api.onboarding.complete(onboardingData);
    console.log('Onboarding complete:', response);
    console.log('Account ID:', response.account_id);
    console.log('Primary Profile ID:', response.primary_profile_id);
  } catch (error) {
    console.error('Onboarding error:', error);
  }
};
```

---

### Activation

#### Validate Token
```typescript
import api from '../services/api.service';

const validateActivationToken = async (token: string) => {
  try {
    const response = await api.activation.validate(token);
    
    if (response.valid) {
      console.log('Token is valid');
      console.log('Profile:', response.profile);
    } else {
      console.log('Token is invalid:', response.message);
    }
  } catch (error) {
    console.error('Validation error:', error);
  }
};
```

#### Activate Profile
```typescript
import api from '../services/api.service';

const activateProfile = async (token: string, password: string) => {
  try {
    const response = await api.activation.activate({
      token,
      password
    });
    
    if (response.success) {
      console.log('Profile activated successfully!');
      // Redirect to login page
    }
  } catch (error) {
    console.error('Activation error:', error);
  }
};
```

---

### Profile

#### Get Current Profile
```typescript
import api from '../services/api.service';

const getCurrentProfile = async () => {
  try {
    const response = await api.profile.getMe();
    console.log('Current profile:', response.profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
  }
};
```

#### Get Family Members
```typescript
import api from '../services/api.service';

const getFamilyMembers = async () => {
  try {
    const response = await api.profile.getFamily();
    console.log('Family members:', response.profiles);
  } catch (error) {
    console.error('Error fetching family:', error);
  }
};
```

---

### Services

#### Get All Services
```typescript
import api from '../services/api.service';

const getServices = async () => {
  try {
    const response = await api.services.list();
    console.log('Available services:', response.services);
  } catch (error) {
    console.error('Error fetching services:', error);
  }
};
```

---

## React Component Examples

### Login Component
```typescript
import { useState } from 'react';
import api from '../services/api.service';
import type { ApiError } from '../types/api.types';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.auth.login({ email, password });
      console.log('Login successful:', response.profile);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Dashboard Component
```typescript
import { useEffect, useState } from 'react';
import api from '../services/api.service';
import type { Profile } from '../types/api.types';

function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, familyRes] = await Promise.all([
          api.profile.getMe(),
          api.profile.getFamily()
        ]);
        
        setProfile(profileRes.profile);
        setFamily(familyRes.profiles);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {profile?.first_name}!</h1>
      
      <h2>Family Members</h2>
      <ul>
        {family.map((member) => (
          <li key={member.id}>
            {member.first_name} {member.last_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Error Handling

All API calls can throw `ApiError` objects:

```typescript
interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
```

### Example Error Handling
```typescript
try {
  await api.auth.login({ email, password });
} catch (err) {
  const error = err as ApiError;
  
  if (error.statusCode === 401) {
    console.log('Invalid credentials');
  } else if (error.statusCode === 0) {
    console.log('Network error - server is down');
  } else {
    console.log('Error:', error.message);
  }
}
```

---

## Authentication Token Management

The API service automatically handles authentication tokens:

- ✅ **Login**: Token is automatically saved to `localStorage`
- ✅ **API Calls**: Token is automatically included in headers
- ✅ **Logout**: Token is automatically removed from `localStorage`

### Manual Token Management (if needed)
```typescript
import { setAuthToken, removeAuthToken } from '../services/api.service';

// Set token manually
setAuthToken('your-token-here');

// Remove token manually
removeAuthToken();
```

---

## Environment Variables

Make sure your `.env` file contains:

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

---

## Testing the API

### Using Browser Console
```javascript
// Test login
const response = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.doe@example.com',
    password: 'securePassword123'
  })
});
const data = await response.json();
console.log(data);
```

### Using the API Service
Create a test file: `src/utils/testApi.ts`

```typescript
import api from '../services/api.service';

export async function testLogin() {
  try {
    const response = await api.auth.login({
      email: 'john.doe@example.com',
      password: 'securePassword123'
    });
    console.log('✅ Login successful:', response);
  } catch (error) {
    console.error('❌ Login failed:', error);
  }
}

export async function testOnboarding() {
  try {
    const response = await api.onboarding.complete({
      primary_profile: {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        password: 'password123',
        mobile: '555-0000',
        date_of_birth: '1990-01-01',
        rceb_flag: false
      },
      family_members: []
    });
    console.log('✅ Onboarding successful:', response);
  } catch (error) {
    console.error('❌ Onboarding failed:', error);
  }
}
```

Then import and call in your component or browser console.

---

## Next Steps

1. ✅ Backend API is configured
2. ✅ API service layer is ready
3. ✅ TypeScript types are defined
4. 🔲 Build onboarding flow UI
5. 🔲 Build login page UI
6. 🔲 Build dashboard UI
7. 🔲 Add authentication context/provider
8. 🔲 Add protected routes
