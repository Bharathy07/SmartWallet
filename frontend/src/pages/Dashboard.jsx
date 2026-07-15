import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import ExpenseChart from '../components/ExpenseChart.jsx';

export default function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBalance(response.data.balance || 0);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket
    const socketConnection = io('http://localhost:5000', {
      auth: { token },
    });

    socketConnection.on('connect', () => {
      console.log('[socket] connected to server');
      socketConnection.emit('join_user', token);
    });

    // Listen for real-time transactions
    socketConnection.on('new_transaction', (transaction) => {
      console.log('[socket] new transaction:', transaction);
      // Refetch balance and transactions
      const fetchUpdatedBalance = async () => {
        try {
          const response = await axios.get('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setBalance(response.data.balance || 0);
        } catch (err) {
          console.error('Failed to fetch updated balance:', err);
        }
      };
      fetchUpdatedBalance();
    });

    socketConnection.on('disconnect', () => {
      console.log('[socket] disconnected from server');
    });

    socketConnection.on('error', (error) => {
      console.error('[socket] error:', error);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/30 p-5">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Your Balance</h2>
        <div className="text-3xl font-bold mt-1">₹ {loading ? 'Loading...' : balance.toLocaleString('en-IN')}</div>
        <p className="text-sm text-slate-500 mt-2">Send money to see AI fraud blocking in action.</p>
      </section>

      <ExpenseChart />
    </div>
  );
}

