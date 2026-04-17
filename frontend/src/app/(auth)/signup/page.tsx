'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser, getErrorMessage } from '@/lib/api';
import { setUserInfo } from '@/lib/auth';
import MotionButton from '@/components/MotionButton';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // interceptor unwraps envelope → res.data is { _id, username, email }
      // JWT is set as an httpOnly cookie by the backend — not in the body
      const { data } = await registerUser(form);
      setUserInfo(data);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-100">Create account</h1>
          <p className="text-gray-400 text-sm mt-1">Join RedThread to start mapping connections</p>
        </div>

        {/* Error */}
        {error && (
          <div
            id="signup-error"
            className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded text-sm mb-5"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-500"
              placeholder="conspiracy_hunter"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
              <span className="text-gray-500 font-normal ml-1">(min 6 characters)</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-500"
              placeholder="••••••••"
            />
          </div>

          <MotionButton
            id="signup-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Sign Up'}
          </MotionButton>
        </form>

        <p className="mt-6 text-sm text-center text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-red-400 hover:text-red-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
