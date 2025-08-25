import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useLocation } from 'react-router-dom';

const ResendConfirmation: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qEmail = params.get('email');
    if (qEmail) setEmail(qEmail);
  }, [location.search]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await apiFetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage('Verification email sent. Please check your inbox.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-2">Resend Confirmation Email</h1>
        <p className="text-sm text-gray-600 mb-4">Enter your email to receive a new verification link.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Resend Email'}
          </button>
        </form>
        {message && <div className="mt-4 text-green-700 bg-green-50 border border-green-200 rounded p-2">{message}</div>}
        {error && <div className="mt-4 text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        <div className="mt-6 text-sm text-gray-600">
          <a href="/login" className="text-blue-600 hover:underline">Back to login</a>
        </div>
      </div>
    </div>
  );
};

export default ResendConfirmation;
