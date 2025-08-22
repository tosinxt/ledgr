import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert-1';
import { XCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid email or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <form
        onSubmit={handleSubmit}
        className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md"
      >
        <div className="p-8 pb-6">
          <div>
            <Link
              to="/"
              aria-label="go home"
              className="text-2xl font-bold text-primary"
            >
              Ledgr
            </Link>
            <h1 className="mb-1 mt-4 text-xl font-semibold">Sign in to your account</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back! Please sign in to continue
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="0.98em" height="1em" viewBox="0 0 256 262">
                <path fill="#4285f4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                <path fill="#34a853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                <path fill="#fbbc05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"></path>
                <path fill="#eb4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
              </svg>
              <span>Google</span>
            </Button>
            <Button type="button" variant="outline" className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256">
                <path fill="#f1511b" d="M121.666 121.666H0V0h121.666z"></path>
                <path fill="#80cc28" d="M256 121.666H134.335V0H256z"></path>
                <path fill="#00adef" d="M121.663 256.002H0V134.336h121.663z"></path>
                <path fill="#fbbc09" d="M256 256.002H134.335V134.336H256z"></path>
              </svg>
              <span>Microsoft</span>
            </Button>
          </div>

          <hr className="my-4 border-dashed" />

          <div aria-live="polite" aria-atomic="true">
            {error && (
              <div className="mb-4">
                <Alert variant="destructive" appearance="light" close onClose={() => setError('')}>
                  <AlertIcon>
                    <XCircle className="text-destructive" />
                  </AlertIcon>
                  <AlertContent>
                    <AlertTitle>Sign-in failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </AlertContent>
                </Alert>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (error) setError('');
                  setEmail(e.target.value);
                }}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="block text-sm">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (error) setError('');
                  setPassword(e.target.value);
                }}
                placeholder="Enter your password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </div>

        <div className="bg-muted rounded-[calc(var(--radius))] border p-3">
          <p className="text-accent-foreground text-center text-sm">
            Don't have an account?
            <Button asChild variant="link" className="px-2">
              <Link to="/register">Sign up</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
};

export default Login;