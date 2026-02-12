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
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { staffService } from '../services/staffService';
// Assuming we have a logo asset similar to ActivateAccount
import logo from '../assets/logo.png'; 

type ValidateActivationResponse = {
  error?: string;
  message?: string;
  email?: string;
  staff?: { email?: string };
};

export const AdminActivation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  // Unlike ActivateAccount, the API response for admin validate might differ slightly,
  // but let's assume it returns some user info or just success.
  const [adminEmail, setAdminEmail] = useState(''); 
  const [error, setError] = useState<string | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activated, setActivated] = useState(false);

  // Extract token and validate on mount
  const validateToken = useCallback(async (tokenValue: string) => {
    try {
      const data = await staffService.validateActivationToken(tokenValue);
      // Adjust based on actual API response structure for Admin Validation
      // The user prompt said: "Use when: Staff clicks the email link. Returns staff details if valid."
      const response = data as ValidateActivationResponse;
      if (response && !response.error) { 
        setIsValid(true);
        // If data contains staff details, set email
        if (response.email) setAdminEmail(response.email);
        else if (response.staff?.email) setAdminEmail(response.staff.email);
      } else {
        setError(response.message || 'Invalid or expired activation link');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate token.';
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
      await staffService.activateAccount(token, password);
      
      setActivated(true);
      setTimeout(() => {
        navigate('/admin/login');
      }, 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate account.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmPassword, navigate, password, token]);

  const handleNavigateAdminLogin = useCallback(() => {
    navigate('/admin/login');
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
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Validating staff activation link...
          </Typography>
        </Box>
      );
    }

    if (activated) {
      return (
        <Fade in={true}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutline sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Account Activated!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your staff account has been successfully activated. Redirecting you to the admin login...
            </Typography>
            <Button
              variant="contained"
              onClick={handleNavigateAdminLogin}
              size="large"
            >
              Go to Admin Login
            </Button>
          </Box>
        </Fade>
      );
    }

    if (!isValid) {
      return (
        <Fade in={true}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Invalid Link
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {error || 'This activation link is invalid or has expired.'}
            </Typography>
            <Button
              variant="outlined"
              onClick={handleNavigateAdminLogin}
            >
              Back to Login
            </Button>
          </Box>
        </Fade>
      );
    }

    return (
      <Fade in={true}>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <AdminPanelSettings sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              Set Staff Password
            </Typography>
            {adminEmail && (
                <Typography variant="body2" color="primary" fontWeight="medium">
                    {adminEmail}
                </Typography>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
              size="large"
              sx={{ mt: 1 }}
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
        bgcolor: '#f1f5f9',
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 3,
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{
                width: 60, height: 60, mb: 1, objectFit: 'contain', mx: 'auto',
              }}
            />
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              Zalexy
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1, textTransform: 'uppercase' }}>
              Staff Portal
            </Typography>
          </Box>

          <Divider sx={{ width: '100%', mb: 3 }} />

          {renderContent()}
          
        </Paper>
      </Container>
    </Box>
  );
};
