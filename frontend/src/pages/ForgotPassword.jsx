import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleReset(e) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    setSuccess(false);

    if (!form.email || !form.password || !form.confirmPassword) {
      setStatus({ ok: false, message: 'Please fill in all fields' });
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus({ ok: false, message: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/reset-password', {
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setStatus({ ok: true, message: response.data.message });
      setSuccess(true);
      setForm({ email: '', password: '', confirmPassword: '' });
      setLoading(false);
      return;
    } catch (err) {
      setStatus({ ok: false, message: err.response?.data?.message || 'Reset failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Enter your email and a new password to reset your account.
      </p>

      <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/30 p-5">
        {status && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${status.ok ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100'}`}
          >
            {status.message}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100">
              <h2 className="text-lg font-semibold mb-2">Password Reset Successful!</h2>
              <p className="text-sm">Your password has been updated. You can now sign in with your new password.</p>
            </div>
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 px-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium transition"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {!success && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 text-center">
            Remembered your password?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
