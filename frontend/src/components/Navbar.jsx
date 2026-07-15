import React from 'react';
import { Moon, Sun, Wallet, LogOut, User as UserIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar({ theme, onThemeChange }) {
  const loc = useLocation();
  const nav = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    nav('/login');
  }

  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
          <span>SmartWallet AI</span>
        </div>

        <nav className="flex items-center gap-4 text-sm">
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className={
                  loc.pathname === '/dashboard'
                    ? 'text-indigo-600 dark:text-indigo-300 font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }
              >
                Dashboard
              </Link>
              <Link
                to="/send"
                className={
                  loc.pathname === '/send'
                    ? 'text-indigo-600 dark:text-indigo-300 font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }
              >
                Send Money
              </Link>
              <Link
                to="/profile"
                className={
                  loc.pathname === '/profile'
                    ? 'text-indigo-600 dark:text-indigo-300 font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }
              >
                <UserIcon className="h-5 w-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium transition"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : null}

          <button
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}

