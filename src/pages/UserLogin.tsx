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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import logo from '../assets/logo.png';
import { ClientOnboardingModal } from './Accounts/ClientOnboarding/ClientOnboardingModal';

interface UserLoginProps {
  companyName?: string;
  locationId?: string;
}

export const UserLogin: React.FC<UserLoginProps> = ({ companyName = 'Zalexy', locationId }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, setCurrentLocationId, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  React.useEffect(() => {
    if (searchParams.get('action') === 'create' || searchParams.get('newAccount') === 'true') {
      setIsRegisterOpen(true);
      searchParams.delete('action');
      searchParams.delete('newAccount');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/portal');
    }
  }, [isAuthenticated, navigate]);

  // Set location context on mount if provided
  React.useEffect(() => {
    if (locationId) {
      setCurrentLocationId(locationId);
    }
  }, [locationId, setCurrentLocationId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await authService.loginUser(email, password);

      // API might return 'user' or 'staff' (as seen in user report) depending on backend implementation
      const userObj = response.user || response.staff || response.profile;
      const token = response.token;
      
      if (!userObj) {
          throw new Error('User profile not found in response');
      }

      // Use profile_id as the unique login ID, and pass full user object (including account_id) as params
      login(token, 'MEMBER', userObj.profile_id, userObj);
      
      if (userObj.location_id) {
          setCurrentLocationId(userObj.location_id);
      } else if (userObj.account?.location_id) {
          setCurrentLocationId(userObj.account.location_id);
      }

      // Honour redirect param (e.g. from waiver signing flow)
      const redirectPath = searchParams.get('redirect');
      const tabParam = searchParams.get('tab');
      const destination = redirectPath
        ? `${redirectPath}${tabParam ? `?tab=${tabParam}` : ''}`
        : '/portal';
      navigate(destination);
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
              {companyName}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#64748b', fontWeight: 500 }}
            >
              Member Access
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
                placeholder="user@example.com"
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

            <Box sx={{ position: 'relative', my: 2 }}>
              <Divider>
                <Typography variant="caption" sx={{ color: '#94a3b8', px: 1, fontWeight: 600 }}>
                  OR
                </Typography>
              </Divider>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => setIsRegisterOpen(true)}
              sx={{
                height: 52,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#2563eb',
                borderColor: '#e2e8f0',
                '&:hover': {
                  bgcolor: '#f8fafc',
                  borderColor: '#2563eb',
                },
              }}
            >
              Create New Account
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
              Secure account access
            </Typography>
          </Box>
        </Paper>
      </Container>
      <ClientOnboardingModal 
        open={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
            // Success state is handled inside the modal for 'user' mode
        }}
        onboardingType={searchParams.get('tabuser') === 'true' ? 'tab_user' : 'user'}
        locationNameProp={companyName}
      />
    </Box>
  );
};
