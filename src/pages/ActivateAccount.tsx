import React, { useCallback, useEffect, useState } from 'react';
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
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  LockOutlined,
  Visibility,
  VisibilityOff,
  CheckCircleOutline,
  ErrorOutline,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import logo from '../assets/logo.png';

export const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activated, setActivated] = useState(false);

  // Extract token and validate on mount
  const validateToken = useCallback(async (tokenValue: string) => {
    try {
      const data = await authService.validateActivationToken(tokenValue);
      
      if (data.success) {
        setIsValid(true);
        setEmail(data.account?.email || '');
      } else {
        setError(data.message || 'Invalid or expired activation link');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate token. Please try again.';
      setError(errorMessage);
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    
    if (!tokenFromUrl) {
      setError('No activation token found in the link.');
      setIsValidating(false);
      return;
    }
    
    setToken(tokenFromUrl);
    validateToken(tokenFromUrl);
  }, [searchParams, validateToken]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!token) throw new Error('Token is missing');
      await authService.activateAccount(token, password);
      
      setActivated(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate account. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmPassword, navigate, password, token]);

  const handleNavigateLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handlePasswordChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  }, []);

  const handleConfirmPasswordChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
  }, []);

  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const renderContent = () => {
    if (isValidating) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={48} sx={{ mb: 2, color: '#2563eb' }} />
          <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
            Validating activation link...
          </Typography>
        </Box>
      );
    }

    if (activated) {
      return (
        <Fade in={true}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutline sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
              Account Activated!
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
              Your account has been successfully activated. Redirecting you to the login page...
            </Typography>
            <Button
              variant="contained"
              onClick={handleNavigateLogin}
              sx={{
                bgcolor: '#2563eb',
                borderRadius: 3,
                textTransform: 'none',
                px: 4,
                py: 1.5,
                fontWeight: 700,
              }}
            >
              Go to Login Now
            </Button>
          </Box>
        </Fade>
      );
    }

    if (!isValid) {
      return (
        <Fade in={true}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <ErrorOutline sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
              Invalid Link
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
              {error || 'This activation link is invalid or has expired.'}
            </Typography>
            <Button
              variant="outlined"
              onClick={handleNavigateLogin}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                px: 4,
                py: 1.5,
                fontWeight: 700,
              }}
            >
              Return to Login
            </Button>
          </Box>
        </Fade>
      );
    }

    return (
      <Fade in={true}>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}>
              Set Your Password
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Set a secure password for your account: <br />
              <Box component="span" sx={{ color: '#2563eb', fontWeight: 600 }}>{email}</Box>
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: '#475569', ml: 0.5 }}>
                New Password
              </Typography>
              <TextField
                required
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                onChange={handlePasswordChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end" sx={{ color: '#94a3b8' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#eff6ff',
                    '& fieldset': { border: 'none' },
                    borderRadius: 2.5,
                    height: 52,
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: '#475569', ml: 0.5 }}>
                Confirm Password
              </Typography>
              <TextField
                required
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#eff6ff',
                    '& fieldset': { border: 'none' },
                    borderRadius: 2.5,
                    height: 52,
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
              sx={{
                mt: 1,
                height: 52,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
              }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Activate Account'}
            </Button>
          </Box>
        </Box>
      </Fade>
    );
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
                width: 80, height: 80, mb: 1, objectFit: 'contain', display: 'block', mx: 'auto',
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5, fontSize: '1.25rem' }}>
              Zalexy
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Account Activation
            </Typography>
          </Box>

          <Divider sx={{ width: '100%', mb: 4, opacity: 0.5 }} />

          {renderContent()}
          
          <Typography variant="caption" sx={{ textAlign: 'center', color: '#94a3b8', fontWeight: 500, mt: 4 }}>
            Secure account setup
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};
