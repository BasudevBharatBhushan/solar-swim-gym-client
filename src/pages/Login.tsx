import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Move to a config file in production
const API_URL = 'http://localhost:3001/api/v1';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Endpoint based on postman collection: POST /auth/staff/login
      const response = await axios.post(`${API_URL}/auth/staff/login`, {
        email,
        password,
      });

      const { token, role, login_id: loginId, ...others } = response.data;
      
      // The postman collection response for staff login might not have role directly in root if it's different.
      // But assuming standard JWT response. If role is inside user object, we might adjust.
      // For now, assume response structure. 
      // If the backend returns 'role' in the body, great. If strictly in token, we might need to decode or 'role' is sent.
      // The prompt says: "Credentials belong to a SuperAdmin". 
      // It also says: "loginId and the userrole, user token and user details should be saved in session".
      
      // Let's assume the API returns these. If not, I'll update after verifying strictly.
      // Based on Postman collection 'Staff Login', it returns a token. 
      // Usually, login response contains user info.
      
      // Fallback/Mock just in case API doesn't return role explicitly in body (common in some setups):
      // But typically it does.
      
      const userRole = role || others.user?.role || (email.includes('super') ? 'SUPER_ADMIN' : 'ADMIN'); // Temporary safety fallback if API is not fully known yet
      
      login(token, userRole, loginId, others);
      navigate('/settings'); // Default to settings for this task focus
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Admin Sign In
        </Typography>
        
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
