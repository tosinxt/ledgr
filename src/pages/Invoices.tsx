import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getJSONCached } from '@/lib/api';
import { clearCacheKey } from '@/lib/cache';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert-1';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

type Invoice = {
  id: string;
  user_id: string;
  amount: number; // cents
  currency: string;
  customer: string;
  status: 'pending' | 'paid';
  created_at: string;
};

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'destructive' | 'info'; text: string } | null>(null);
  const navigate = useNavigate();

  const load = async (force = false) => {
    try {
      setLoading(true);
      if (force) clearCacheKey('invoices');
      const res = await getJSONCached<{ invoices: Invoice[] }>('invoices', '/api/invoices', 30_000);
      setInvoices(res.invoices);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  

  useEffect(() => {
    load();
  }, []);

  const pay = async (id: string) => {
    try {
      await apiFetch(`/api/invoices/${id}/pay`, { method: 'POST' });
      clearCacheKey('invoices');
      await load(true);
      setMessage({ type: 'success', text: 'Invoice marked as paid.' });
      setTimeout(() => setMessage(null), 1500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to pay invoice';
      setMessage({ type: 'destructive', text: msg });
    }
  };

  if (loading) return <div>Loading invoices...</div>;
  if (error)
    return (
      <div className="max-w-xl">
        <Alert variant="destructive" appearance="light" close onClose={() => setError(null)}>
          <AlertIcon>
            <XCircle className="text-destructive" />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>Failed to load invoices</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </AlertContent>
        </Alert>
      </div>
    );

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type} appearance="light" close onClose={() => setMessage(null)}>
          <AlertIcon>
            {message.type === 'destructive' ? (
              <XCircle className="text-destructive" />
            ) : message.type === 'success' ? (
              <CheckCircle2 className="text-[var(--color-success-foreground,var(--color-green-600))]" />
            ) : (
              <Info />
            )}
          </AlertIcon>
          <AlertContent>
            <AlertTitle>{message.type === 'destructive' ? 'Action failed' : 'Success'}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </AlertContent>
        </Alert>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Invoices</h2>
        <a href="/dashboard/create-invoice" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Create</a>
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Created</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="px-4 py-2">{inv.customer}</td>
                  <td className="px-4 py-2">{inv.currency} {(inv.amount/100).toFixed(2)}</td>
                  <td className="px-4 py-2 capitalize">{inv.status}</td>
                  <td className="px-4 py-2">{new Date(inv.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button onClick={() => navigate(`/dashboard/invoices/${inv.id}`)} className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800">Preview & Export</button>
                    {inv.status === 'pending' && (
                      <button onClick={() => pay(inv.id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">No invoices yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y divide-neutral-200 dark:divide-neutral-800">
          {invoices.length === 0 && (
            <div className="px-4 py-6 text-center text-neutral-500">No invoices yet</div>
          )}
          {invoices.map(inv => (
            <div key={inv.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">{inv.customer}</div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">{new Date(inv.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">{inv.currency} {(inv.amount/100).toFixed(2)}</div>
                  <div className="text-xs capitalize inline-flex items-center rounded-full px-2 py-0.5 mt-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">{inv.status}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => navigate(`/dashboard/invoices/${inv.id}`)} className="px-3 py-1 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm">Preview</button>
                {inv.status === 'pending' && (
                  <button onClick={() => pay(inv.id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">Mark Paid</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Invoices;
