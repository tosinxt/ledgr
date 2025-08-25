import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert-1';
import { CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function parseHashTokens() {
  const hash = window.location.hash || '';
  const qp = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const access_token = qp.get('access_token') || undefined;
  const refresh_token = qp.get('refresh_token') || undefined;
  const type = qp.get('type') || undefined; // expected 'recovery'
  return { access_token, refresh_token, type };
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Try to exchange code first (covers PKCE-style links)
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (!error && data?.session) {
            if (mounted) setReady(true);
            return;
          }
        } catch {
          // ignore; fall back to hash tokens
        }
        const { access_token, refresh_token, type } = parseHashTokens();
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          if (type && type !== 'recovery') {
            // Continue but show info
            setInfo(`Notice: link type was "${type}"`);
          }
          if (mounted) setReady(true);
        } else {
          setError('Invalid or expired reset link. Please request a new one.');
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to initialize reset flow');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setUpdated(true);
      // We still rely on backend cookie sessions; prompt user to log in again.
      setTimeout(() => navigate('/login'), 1500);
    } catch (e: any) {
      setError(e?.message || 'Failed to reset password');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <form onSubmit={onSubmit} className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md">
        <div className="p-8 pb-6">
          <div>
            <Link to="/" aria-label="go home" className="text-2xl font-bold text-primary">
              Ledgr
            </Link>
            <h1 className="mb-1 mt-4 text-xl font-semibold">Reset your password</h1>
            <p className="text-sm text-muted-foreground">Enter a new password for your account.</p>
          </div>

          <div className="mt-4 space-y-3" aria-live="polite" aria-atomic="true">
            {!ready && (
              <Alert variant="destructive" appearance="light">
                <AlertIcon>
                  <XCircle className="text-destructive" />
                </AlertIcon>
                <AlertContent>
                  <AlertTitle>Link problem</AlertTitle>
                  <AlertDescription>{error || 'This link is not valid for password reset.'}</AlertDescription>
                </AlertContent>
              </Alert>
            )}
            {info && (
              <Alert variant="info" appearance="light">
                <AlertIcon>i</AlertIcon>
                <AlertContent>
                  <AlertDescription>{info}</AlertDescription>
                </AlertContent>
              </Alert>
            )}
            {updated && (
              <Alert variant="success" appearance="light">
                <AlertIcon>
                  <CheckCircle2 className="text-green-600" />
                </AlertIcon>
                <AlertContent>
                  <AlertTitle>Password updated</AlertTitle>
                  <AlertDescription>Redirecting to sign in…</AlertDescription>
                </AlertContent>
              </Alert>
            )}
            {error && ready && !updated && (
              <Alert variant="destructive" appearance="light" close onClose={() => setError('')}>
                <AlertIcon>
                  <XCircle className="text-destructive" />
                </AlertIcon>
                <AlertContent>
                  <AlertTitle>Reset failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </AlertContent>
              </Alert>
            )}
          </div>

          <fieldset className="space-y-4 mt-4" disabled={!ready || updated}>
            <div className="space-y-2">
              <Label htmlFor="password" className="block text-sm">New password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="block text-sm">Confirm password</Label>
              <Input id="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" />
            </div>
            <Button type="submit" className="w-full" disabled={!ready || updated}>Update password</Button>
          </fieldset>
        </div>

        <div className="bg-muted rounded-[calc(var(--radius))] border p-3">
          <p className="text-accent-foreground text-center text-sm">
            Back to
            <Button asChild variant="link" className="px-2">
              <Link to="/login">Sign in</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
};

export default ResetPassword;
