import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert-1';
import { CheckCircle2, XCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSent(false);
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSent(true);
    } catch (e: any) {
      let msg = e instanceof Error ? e.message : 'Failed to send reset email';
      try {
        if (msg.trim().startsWith('{')) {
          const p = JSON.parse(msg);
          if (typeof p?.error === 'string') msg = p.error;
        }
      } catch {}
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <form onSubmit={onSubmit} className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md">
        <div className="p-8 pb-6">
          <div>
            <Link to="/" aria-label="go home" className="text-2xl font-bold text-primary">
              Ledgr
            </Link>
            <h1 className="mb-1 mt-4 text-xl font-semibold">Forgot your password?</h1>
            <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
          </div>

          <div className="mt-4" aria-live="polite" aria-atomic="true">
            {sent && (
              <Alert variant="success" appearance="light">
                <AlertIcon>
                  <CheckCircle2 className="text-green-600" />
                </AlertIcon>
                <AlertContent>
                  <AlertTitle>Check your email</AlertTitle>
                  <AlertDescription>
                    If an account exists for {email}, a password reset link has been sent.
                  </AlertDescription>
                </AlertContent>
              </Alert>
            )}
            {error && (
              <div className="mt-3">
                <Alert variant="destructive" appearance="light" close onClose={() => setError('')}>
                  <AlertIcon>
                    <XCircle className="text-destructive" />
                  </AlertIcon>
                  <AlertContent>
                    <AlertTitle>Request failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </AlertContent>
                </Alert>
              </div>
            )}
          </div>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </div>
        </div>

        <div className="bg-muted rounded-[calc(var(--radius))] border p-3">
          <p className="text-accent-foreground text-center text-sm">
            Remembered your password?
            <Button asChild variant="link" className="px-2">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
};

export default ForgotPassword;
