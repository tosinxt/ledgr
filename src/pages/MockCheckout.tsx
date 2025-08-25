import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { confirmCryptoIntent, getCryptoIntent, type PaymentIntent } from '@/lib/api';

const centsToUSD = (cents: number) => (cents / 100).toFixed(2);

const MockCheckout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) throw new Error('Missing intent id');
        const it = await getCryptoIntent(id);
        setIntent(it);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load intent');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onConfirm = async () => {
    if (!id) return;
    try {
      setConfirming(true);
      const res = await confirmCryptoIntent(id);
      setIntent(res.intent);
      // If linked to invoice, navigate back to invoices so status updates
      setTimeout(() => navigate('/dashboard/invoices'), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to confirm');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="p-6">Loading checkout…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!intent) return <div className="p-6">No intent found.</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mock Crypto Checkout</h1>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 bg-white dark:bg-neutral-900">
        <div className="text-sm text-neutral-500">Intent ID</div>
        <div className="font-mono text-sm break-all">{intent.id}</div>
        {intent.invoice_id && (
          <div className="mt-2 text-sm">Linked Invoice: <span className="font-medium">{intent.invoice_id}</span></div>
        )}
        <div className="mt-2 text-lg">Amount: ${centsToUSD(intent.amount_cents)} {intent.currency}</div>
        <div className="mt-1">Status: <span className="capitalize font-medium">{intent.status}</span></div>
      </div>
      {intent.status === 'pending' ? (
        <button
          onClick={onConfirm}
          disabled={confirming}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {confirming ? 'Confirming…' : 'Confirm Payment (Mock)'}
        </button>
      ) : (
        <div className="text-green-700">Payment confirmed.</div>
      )}
      <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded-lg">Back</button>
    </div>
  );
};

export default MockCheckout;
