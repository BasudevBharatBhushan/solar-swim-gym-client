import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Login</h1>
          <p className="text-gray-500 text-sm">Solar Swim & Gym Admin Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase mb-1.5 tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-black focus:border-black transition-all outline-none text-sm"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" shaking-text-on-hover="true" className="text-xs text-gray-400 hover:text-black transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-1 focus:ring-black focus:border-black transition-all outline-none text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg text-white font-semibold text-sm transition-all 
              ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/onboarding" className="font-semibold text-black hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};
