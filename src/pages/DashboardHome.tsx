import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getJSON } from '@/lib/api';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert-1';
import { XCircle } from 'lucide-react';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();

  type Invoice = { id: string; user_id: string; amount: number; currency: string; customer: string; status: 'pending'|'paid'|'void'; created_at: string };
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getJSON<{ invoices: Invoice[] }>('/api/invoices');
        if (mounted) setInvoices(res.invoices || []);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load invoices';
        if (mounted) setError(msg);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const list = invoices || [];
    const thisMonth = list.filter(inv => new Date(inv.created_at) >= monthStart);
    const totalCount = thisMonth.length;
    const totalAmountCents = thisMonth.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const pendingCount = thisMonth.filter(inv => inv.status === 'pending').length;
    return { totalCount, totalAmountCents, pendingCount };
  }, [invoices]);

  return (
    <div className="border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-lg p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Welcome back, {user?.name}!
        </h1>
        {error && (
          <div className="mx-auto max-w-md mb-4">
            <Alert variant="destructive" appearance="light" close onClose={() => setError('')}>
              <AlertIcon>
                <XCircle className="text-destructive" />
              </AlertIcon>
              <AlertContent>
                <AlertTitle>Failed to load dashboard data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </AlertContent>
            </Alert>
          </div>
        )}
        <div className="mb-8">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {user?.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Total Invoices</h3>
            <p className="text-3xl font-bold text-blue-600">{invoices ? metrics.totalCount : '—'}</p>
            <p className="text-sm text-gray-500 mt-1">This month</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Total Amount</h3>
            <p className="text-3xl font-bold text-green-600">{invoices ? `$${(metrics.totalAmountCents/100).toFixed(2)}` : '—'}</p>
            <p className="text-sm text-gray-500 mt-1">This month</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{invoices ? metrics.pendingCount : '—'}</p>
            <p className="text-sm text-gray-500 mt-1">Awaiting payment</p>
          </div>
        </div>
        <div className="space-y-4">
          <Link
            to="/create-invoice"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Your First Invoice
          </Link>
          <div className="text-sm text-gray-500">
            <p>
              You're on the <strong>{user?.plan === 'free' ? 'Free' : 'Pro'}</strong> plan.
              {user?.plan === 'free' && (
                <span>
                  {' '}
                  <Link to="/upgrade" className="text-blue-600 hover:text-blue-500">
                    Upgrade to Pro
                  </Link>{' '}for unlimited invoices and advanced features.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
