import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activationApi } from '../../services/api.service';

export const ActivationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) return;
      try {
        const response = await activationApi.validate(token);
        if (response.valid) {
          setIsValid(true);
          if (response.profile) {
             setProfileName(`${response.profile.first_name} ${response.profile.last_name}`);
          }
        } else {
          setError(response.message || 'Invalid or expired token.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to validate token.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) return;

    try {
      setError('');
      await activationApi.activate({ token, password });
      setSuccess('Account activated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Activation failed');
    }
  };

  if (isValidating) {
    return <div>Validating activation link...</div>;
  }

  if (!isValid) {
    return (
      <div className="auth-container">
        <div className="error-card">
          <h2>Activation Failed</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Activate Account</h2>
        {profileName && <p>Welcome, {profileName}!</p>}
        <p>Please set a password for your account.</p>
        
        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <button type="submit">Activate Account</button>
        </form>
      </div>
    </div>
  );
};
