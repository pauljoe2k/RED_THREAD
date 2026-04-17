'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { removeUserInfo, isLoggedIn } from '@/lib/auth';
import { logoutUser } from '@/lib/api';

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname(); // triggers re-check on every route change
  const [loggedIn, setLoggedIn] = useState(false);

  // Re-evaluate UI cookie on every navigation.
  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, [pathname]);

  const handleLogout = async () => {
    try {
      // Ask backend to clear the httpOnly JWT cookie
      await logoutUser();
    } catch {
      // Network error: still proceed with local cleanup
    }
    // Clear the UI-state cookie and update nav
    removeUserInfo();
    setLoggedIn(false);
    router.push('/login');
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/dashboard"
          id="nav-logo"
          className="font-bold text-lg text-red-500 tracking-tight"
        >
          RedThread
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-4">
          {loggedIn ? (
            <>
              <Link
                href="/dashboard"
                id="nav-dashboard"
                className="text-sm text-gray-300 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/nodes/new"
                id="nav-new-node"
                className="text-sm text-gray-300 hover:text-white"
              >
                + Node
              </Link>
              <Link
                href="/threads/new"
                id="nav-new-thread"
                className="text-sm text-gray-300 hover:text-white"
              >
                + Thread
              </Link>
              <button
                id="nav-logout"
                onClick={handleLogout}
                className="text-sm border border-gray-600 text-gray-300 px-3 py-1 rounded hover:bg-gray-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                id="nav-login"
                className="text-sm text-gray-300 hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/signup"
                id="nav-signup"
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
