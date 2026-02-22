import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import {
  EmailOutlined,
  LockOutlined,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

// Move to a config file in production
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && (role === 'ADMIN' || role === 'SUPERADMIN')) {
      navigate('/admin/leads');
    }
  }, [isAuthenticated, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/staff/login`, {
        email,
        password,
      });

      const { token, staff } = response.data;
      const { role, staff_id: staffId, ...userDetails } = staff;
      const userRole = role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN';
      
      login(token, userRole, staffId, userDetails);
      navigate('/admin/leads');
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 4,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 0, 0, 0.03)',
          }}
        >
          {/* Logo and Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{
                width: 80,
                height: 80,
                mb: 1,
                objectFit: 'contain',
                display: 'block',
                mx: 'auto',
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#1e293b',
                mb: 0.5,
                fontSize: '1.25rem',
              }}
            >
              Zalexy
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#64748b', fontWeight: 500 }}
            >
              Admin Portal
            </Typography>
          </Box>

          <Divider sx={{ width: '100%', mb: 4, opacity: 0.5 }} />

          <Box sx={{ width: '100%', mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                color: '#1e293b',
                fontWeight: 700,
                fontSize: '1.1rem',
                mb: 1,
              }}
            >
              Sign in to your account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            {/* Email Field */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 0.75,
                  fontWeight: 600,
                  color: '#475569',
                  ml: 0.5,
                }}
              >
                Email
              </Typography>
              <TextField
                required
                fullWidth
                id="email"
                placeholder="superadmin@solar.com"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#eff6ff',
                    '& fieldset': { border: 'none' },
                    '&:hover fieldset': { border: 'none' },
                    '&.Mui-focused fieldset': { border: 'none' },
                    borderRadius: 2.5,
                    height: 52,
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.95rem',
                    color: '#1e293b',
                  },
                }}
              />
            </Box>

            {/* Password Field */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 0.75,
                  fontWeight: 600,
                  color: '#475569',
                  ml: 0.5,
                }}
              >
                Password
              </Typography>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="••••••••••"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#94a3b8' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#eff6ff',
                    '& fieldset': { border: 'none' },
                    '&:hover fieldset': { border: 'none' },
                    '&.Mui-focused fieldset': { border: 'none' },
                    borderRadius: 2.5,
                    height: 52,
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.95rem',
                    color: '#1e293b',
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 1,
                mb: 1,
                height: 52,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                bgcolor: '#2563eb',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                },
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)',
              }}
            >
              Sign In
            </Button>
            
            <Typography
              variant="caption"
              sx={{
                textAlign: 'center',
                color: '#94a3b8',
                fontWeight: 500,
                mt: 1,
              }}
            >
              Secure administrative access only
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
