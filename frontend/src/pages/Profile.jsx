import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Phone, MapPin, Calendar, ArrowLeft } from 'lucide-react';

export default function Profile() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpStatus, setTopUpStatus] = useState(null);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setTimeout(() => nav('/login'), 2000);
          return;
        }
        const response = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to load profile';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [nav]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-slate-600 dark:text-slate-300">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => nav('/dashboard')}
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => nav('/dashboard')}
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <div className="text-center text-slate-600 dark:text-slate-300">User not found</div>
      </div>
    );
  }

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => nav('/dashboard')}
        className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/30 p-8">
        <div className="text-center mb-8">
          <div className="inline-block w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{user.name || 'User'}</h1>
          <p className="text-slate-600 dark:text-slate-300">{user.email}</p>
        </div>

        <div className="space-y-6">
          {/* Account Balance */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Account Balance</div>
            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              ₹ {(user.balance || 0).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Top up wallet */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add amount to wallet</h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setTopUpStatus(null);

                const amt = Number(topUpAmount);
                if (!Number.isFinite(amt) || amt <= 0) {
                  setTopUpStatus({ ok: false, message: 'Enter a valid amount' });
                  return;
                }

                try {
                  const token = localStorage.getItem('token');
                  await axios.post(
                    '/api/wallet/top-up',
                    { amount: amt },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );

                  const refreshed = await axios.get('/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                  });

                  setUser(refreshed.data);
                  setTopUpAmount('');
                  setTopUpStatus({ ok: true, message: 'Wallet updated successfully' });
                } catch (err) {
                  const msg = err.response?.data?.message || err.message || 'Top up failed';
                  setTopUpStatus({ ok: false, message: msg });
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm mb-1 font-medium text-slate-700 dark:text-slate-200">Amount (₹)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
              >
                Add to Wallet
              </button>

              {topUpStatus && (
                <div
                  className={
                    topUpStatus.ok
                      ? 'p-3 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 text-sm'
                      : 'p-3 rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100 text-sm'
                  }
                >
                  {topUpStatus.message}
                </div>
              )}
            </form>
          </div>

          {/* Personal Information */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Personal Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Email</div>
                  <div className="text-slate-900 dark:text-white">{user.email}</div>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Phone</div>
                    <div className="text-slate-900 dark:text-white">{user.phone}</div>
                  </div>
                </div>
              )}

              {user.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Address</div>
                    <div className="text-slate-900 dark:text-white">{user.address}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Member Since</div>
                  <div className="text-slate-900 dark:text-white">{joinedDate}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Account Status</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Account Status</div>
                <div className="text-slate-900 dark:text-white font-medium">Active</div>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
