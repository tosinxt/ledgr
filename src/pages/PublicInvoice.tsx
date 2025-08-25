import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

interface PublicInvoiceData {
  id: string;
  created_at: string;
  status: string;
  amount: number; // cents
  currency: string;
  customer: string;
  items?: Array<{ description: string; quantity: number; rate: number }> | null;
  tax_rate?: number | null;
  notes?: string | null;
  company_name?: string | null;
  company_address?: string | null;
  client_email?: string | null;
  client_address?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  template_kind?: 'simple'|'detailed'|'proforma';
}

const PublicInvoice: React.FC = () => {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const token = sp.get('token') || '';
  const [data, setData] = useState<PublicInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const base = import.meta.env.VITE_API_BASE_URL || '';
        const url = `${base}/api/public/invoices/${id}?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e: any) {
        setError(e?.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!data) return null;

  const nf = new Intl.NumberFormat('en-US', { style: 'currency', currency: (data.currency || 'USD').toUpperCase() });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Invoice</h1>
            <p className="text-xs text-neutral-500">ID: {data.id}</p>
          </div>
          <span className="text-xs rounded-full bg-neutral-100 dark:bg-neutral-700 px-2 py-1 text-neutral-700 dark:text-neutral-200">{data.status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">From</p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{data.company_name || 'Your Company'}</p>
            {data.company_address && <p className="text-xs text-neutral-500 whitespace-pre-wrap">{data.company_address}</p>}
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Bill To</p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{data.customer}</p>
            {data.client_email && <p className="text-xs text-neutral-500">{data.client_email}</p>}
            {data.client_address && <p className="text-xs text-neutral-500 whitespace-pre-wrap">{data.client_address}</p>}
          </div>
        </div>

        {Array.isArray(data.items) && data.items.length > 0 ? (
          <div className="mb-6">
            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">Items</div>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {data.items.map((it, idx) => {
                const line = Number(it.quantity) * Number(it.rate);
                return (
                  <div key={idx} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <div className="text-neutral-900 dark:text-neutral-100">{it.description}</div>
                      <div className="text-xs text-neutral-500">Qty {it.quantity} × {nf.format(it.rate)}</div>
                    </div>
                    <div className="text-neutral-900 dark:text-neutral-100">{nf.format(line)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <div className="w-full md:w-80 bg-neutral-50 dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 p-4 text-sm">
            <div className="flex justify-between mb-2"><span>Currency</span><span className="font-medium">{String(data.currency).toUpperCase()}</span></div>
            {Array.isArray(data.items) && data.items.length > 0 && (
              <>
                <div className="flex justify-between mb-2"><span>Tax</span><span className="font-medium">{Number(data.tax_rate || 0)}%</span></div>
              </>
            )}
            <div className="flex justify-between text-base mt-2 border-t border-neutral-200 dark:border-neutral-700 pt-2">
              <span>Total</span>
              <span className="font-semibold text-blue-600">{nf.format(Number(data.amount || 0) / 100)}</span>
            </div>
          </div>
        </div>

        {data.notes && (
          <div className="mt-6">
            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">Notes</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-neutral-500">Powered by Ledgr</div>
      </div>
    </div>
  );
};

export default PublicInvoice;
