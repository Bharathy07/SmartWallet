import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function ExpenseChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket for real-time updates
    const socketConnection = io('http://localhost:5000', {
      auth: { token },
    });

    socketConnection.on('connect', () => {
      console.log('[socket-chart] connected');
      socketConnection.emit('join_user', token);
    });

    // Listen for new transactions in real-time
    socketConnection.on('new_transaction', (newTransaction) => {
      console.log('[socket-chart] new transaction received:', newTransaction);
      setTransactions(prev => {
        const next = [newTransaction, ...prev];
        console.log('[ExpenseChart] transactions after append:', next);
        return next;
      });
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(response.data);
        const weekData = processWeeklyExpenses(response.data);
        setData(weekData);
        // Helpful debug: confirm chart input matches API response
        console.log('[ExpenseChart] fetched transactions:', response.data);
        console.log('[ExpenseChart] weekly data:', weekData);
      } catch (err) {
        console.error('Failed to fetch expenses:', err);
        // Fallback to demo data on error
        setData([
          { day: 'Mon', expense: 120 },
          { day: 'Tue', expense: 90 },
          { day: 'Wed', expense: 150 },
          { day: 'Thu', expense: 70 },
          { day: 'Fri', expense: 200 },
          { day: 'Sat', expense: 60 },
          { day: 'Sun', expense: 110 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  useEffect(() => {
    // Update chart when transactions change
    const weekData = processWeeklyExpenses(transactions);
    setData(weekData);
  }, [transactions]);

  function processWeeklyExpenses(transactions) {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Only debit legs are shown in this chart.
    const weekData = weekDays.map(day => ({ day, debited: 0, credited: 0 }));

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const currentUserId = localStorage.getItem('userId');
    const hasUserId = !!currentUserId;

    // Fallback: try to get user id from stored token payload
    // (backend currently returns `user._id` but app doesn't consistently persist userId).
    const fallbackUserId = (() => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.userId || payload.id || null;
      } catch {
        return null;
      }
    })();

    const effectiveUserId = hasUserId ? currentUserId : fallbackUserId;
    const hasEffectiveUserId = !!effectiveUserId;

    const txInWeek = transactions.filter(tx => {
      const txDate = new Date(tx.date || tx.createdAt);
      return txDate >= oneWeekAgo && !Number.isNaN(txDate.getTime());
    });

    if (txInWeek.length) {
      console.log('[ExpenseChart] tx in week sample', txInWeek.slice(0, 5).map(t => ({
        id: t._id,
        amount: t.amount,
        fromUserId: typeof t.fromUserId === 'object' ? t.fromUserId?._id : t.fromUserId,
        toUserId: typeof t.toUserId === 'object' ? t.toUserId?._id : t.toUserId,
        createdAt: t.createdAt,
      })));
    }

    transactions.forEach(tx => {
      const txDate = new Date(tx.date || tx.createdAt);
      if (txDate < oneWeekAgo || Number.isNaN(txDate.getTime())) return;

      const dayIndex = txDate.getDay();
      const amt = Number(tx.amount);
      if (!Number.isFinite(amt) || amt <= 0) return;

      // Incoming to you = credited (green). Outgoing from you = debited (blue).
      const fromId = typeof tx.fromUserId === 'object' ? tx.fromUserId?._id : tx.fromUserId;
      const toId = typeof tx.toUserId === 'object' ? tx.toUserId?._id : tx.toUserId;

      // Determine the “current user” id:
      // - preferred: localStorage.userId
      // - fallback: decoded token payload
      const userIdToUse = hasUserId ? currentUserId : effectiveUserId;
      if (!userIdToUse) return;

      // Only count “sent to someone” transactions as debited.
      // Exclude wallet top-ups/self-to-self transactions (fromUserId === toUserId).
      const isSelfToSelf = fromId && toId && String(fromId) === String(toId);
      if (!isSelfToSelf && String(toId) !== String(userIdToUse)) {
        // Additionally exclude money received/credited legs: those are where toUserId is the user.
        // If we got here, it means toUserId is NOT the user => outgoing.
        weekData[dayIndex].debited += amt;
      }
      return;
    });

    const creditedByDay = weekData.map(d => ({ day: d.day, credited: d.credited, debited: d.debited }));
    const totals = creditedByDay.reduce(
      (acc, d) => {
        acc.credited += d.credited;
        acc.debited += d.debited;
        return acc;
      },
      { credited: 0, debited: 0 }
    );

    console.log('[ExpenseChart] week totals', { ...totals, userId: currentUserId });
    console.log('[ExpenseChart] by day', creditedByDay);

    return weekData;
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/30 p-4">
        <h2 className="text-sm font-semibold mb-3">Weekly Expenses</h2>
        <div className="h-64 flex items-center justify-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/30 p-4">
      <h2 className="text-sm font-semibold mb-3">Weekly Expenses</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDebited" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorCredited" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="debited"
              name="Debited"
              stroke="#2563eb"
              fillOpacity={1}
              fill="url(#colorDebited)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

