import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function SendMoney() {
  const nav = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    fromUserId: '',
    toUserId: '',
    toUsername: '',
    amount: '100',
  });

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          nav('/login');
          return;
        }

        const response = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(response.data);
        setForm((f) => ({ ...f, fromUserId: response.data._id }));

        // Fetch all users for recipient selection (excluding current user)
        const allUsersResp = await axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const otherUsers = allUsersResp.data.filter((u) => u._id !== response.data._id);
        setUsers(otherUsers);

        // Fetch the user's past transactions
        try {
          const txResp = await axios.get('/api/transactions', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTransactions(txResp.data);
        } catch (txErr) {
          console.error('Failed to fetch transactions:', txErr);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        if (err.response?.status === 401) {
          nav('/login');
        }
      } finally {
        setLoading(false);
        setTransactionsLoading(false);
      }
    };
    fetchCurrentUser();
  }, [nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus(null);

    // Support 2 modes:
    // 1) Dropdown selection -> form.toUserId is set
    // 2) Manual typing -> we resolve a user id if the typed name matches an existing user
    let resolvedToUserId = form.toUserId;

    const typed = String(form.toUsername || '').trim();
    if (!resolvedToUserId && typed) {
      const matched = users.find((u) => String(u.name || '').trim().toLowerCase() === typed.toLowerCase());
      if (matched) {
        resolvedToUserId = matched._id;
      }
    }

    if (!resolvedToUserId) {
      setStatus({ ok: false, message: 'Fake User' });
      return;
    }


    if (!form.amount || Number(form.amount) <= 0) {
      setStatus({ ok: false, message: 'Please enter a valid amount' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const resp = await axios.post(
        '/api/transactions/send',
        {
          fromUserId: form.fromUserId,
          toUserId: form.toUserId,
          toUsername: form.toUsername, // typed username for special blocking rule
          amount: Number(form.amount),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStatus({
        ok: true,
        blocked: false,
        error: false,
        ...resp.data,
      });

      // Refresh past transactions so blocked/allowed states show up in history immediately
      try {
        const token = localStorage.getItem('token');
        const txResp = await axios.get('/api/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransactions(txResp.data);
      } catch (e) {
        console.error('Failed to refresh transactions:', e);
      }

      setForm((f) => ({ ...f, amount: '100', toUsername: '' }));
    } catch (err) {
      if (err.response) {
        const data = err.response.data || {};
        const isBlocked = err.response.status === 403 || Boolean(data.ai?.allow === false);
        const isServerError = err.response.status >= 500;
        let message = data.message || data.ai?.reason;

        if (!message) {
          if (isServerError) {
            message = 'Server error';
          } else if (isBlocked) {
            message = 'Transaction blocked';
          } else {
            message = 'Transaction failed';
          }
        }

        setStatus({
          ok: false,
          blocked: isBlocked,
          error: isServerError,
          message,
          ai: data.ai,
          transactionId: data.transactionId,
        });
      } else {
        setStatus({ ok: false, blocked: false, error: true, message: 'Network error' });
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-slate-600 dark:text-slate-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Send Money</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        AI fraud detection analyzes transactions before processing.
      </p>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/30 p-5 space-y-4"
      >
        {/* From User (Current User - Read Only) */}
        <div>
          <label className="block text-sm mb-1 font-medium">From (Your Account)</label>
          <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
            <div className="text-slate-900 dark:text-white font-medium">{currentUser?.name || 'Loading...'}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">{currentUser?.email}</div>
          </div>
        </div>

        {/* Recipient Selection */}
        <div>
          <label className="block text-sm mb-1 font-medium">To (Recipient)</label>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            You can pick from the dropdown OR type a username (e.g., Test User A).
          </div>

          <div className="space-y-3">
            {users.length > 0 ? (
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={form.toUserId}
                onChange={(e) => {
                  const v = e.target.value;
                  const picked = users.find((u) => u._id === v);
                  setForm((f) => ({
                    ...f,
                    toUserId: v,
                    toUsername: picked?.name || '',
                  }));
                }}
              >
                <option value="">Select a recipient...</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                No other users available
              </div>
            )}

            <input
              type="text"
              placeholder="Type recipient username (e.g., Test User A)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
              value={form.toUsername}
              onChange={(e) => setForm((f) => ({ ...f, toUsername: e.target.value }))}
            />
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm mb-1 font-medium">Amount (₹)</label>
          <input
            type="number"
            step="1"
            min="1"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium transition"
          disabled={(!form.toUserId && !(form.toUsername || '').trim()) || !form.amount}
        >
          Send Money (AI Check)
        </button>

        {status && (
          <div
            className={
              status.ok
                ? 'p-4 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100'
                : status.error
                ? 'p-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100'
                : 'p-4 rounded-lg border border-rose-300 bg-rose-50 dark:bg-amber-950/30 text-rose-900 dark:text-rose-100'
            }
          >
            <div className="font-semibold mb-1">
              {status.ok ? 'Transaction Allowed ✅' : status.error ? 'Transaction Error ⚠️' : 'Transaction Blocked ❌'}
            </div>
            {status.message && <div className="text-sm">{status.message}</div>}

            {status.ai && (
              <div className="text-sm mt-2 space-y-1">
                <div>
                  <span className="font-medium">AI Decision:</span> {String(status.ai.allow)}
                </div>
                <div>
                  <span className="font-medium">Risk Score:</span> {status.ai.riskScore}/100
                </div>
                <div>
                  <span className="font-medium">Reason:</span> {status.ai.reason}
                </div>
              </div>
            )}

            {status.transactionId && (
              <div className="text-xs mt-2 opacity-80">Transaction ID: {status.transactionId}</div>
            )}
          </div>
        )}
      </form>

      <section className="mt-8 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/30 p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Past Transactions</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Recent activity for your account.</p>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Showing latest 50</span>
        </div>

        {transactionsLoading ? (
          <div className="text-center text-slate-600 dark:text-slate-300 py-8">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-slate-600 dark:text-slate-300 py-8">
            No past transactions yet. Send money to create your first transaction.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const fromUser = typeof tx.fromUserId === 'object' ? tx.fromUserId : { name: tx.fromUserId };
              const toUser = typeof tx.toUserId === 'object' ? tx.toUserId : { name: tx.toUserId };
              const isOutgoing = currentUser && String(tx.fromUserId?._id || tx.fromUserId) === String(currentUser._id);
              const counterparty = isOutgoing ? toUser : fromUser;
              const label = isOutgoing ? 'Sent to' : 'Received from';
              const statusLabel = tx.status === 'allowed' ? 'Allowed' : 'Blocked';
              const statusClasses =
                tx.status === 'allowed'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';

              const isBlocked = tx.status !== 'allowed';
              const directionClasses = isBlocked
                ? 'text-amber-700 dark:text-amber-200'
                : isOutgoing
                ? 'text-blue-700 dark:text-blue-200'
                : 'text-emerald-700 dark:text-emerald-200';

              const directionLabel = isBlocked ? 'Failed' : isOutgoing ? 'Debited' : 'Credited';

              return (
                <div
                  key={tx._id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/40 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
                      <div className="font-medium text-slate-900 dark:text-white">{counterparty?.name || counterparty?.email || 'Unknown'}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-semibold ${directionClasses}`}>₹{tx.amount.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{directionLabel}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2.5 py-1 font-semibold ${statusClasses}`}>{statusLabel}</span>
                    <span className="text-slate-500 dark:text-slate-400">Risk {tx.riskScore}/100</span>
                    <span className="text-slate-500 dark:text-slate-400">{tx.aiReason}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

