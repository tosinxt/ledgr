import React, { useEffect, useMemo, useState } from 'react';
import { listWallets, listWalletTransactions, createCryptoIntent, confirmCryptoIntent, type Wallet, type WalletTransaction } from '@/lib/api';

const centsToUSD = (cents: number) => (cents / 100).toFixed(2);

const WalletPage: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [txs, setTxs] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [amount, setAmount] = useState<string>('10.00');
  const [creating, setCreating] = useState(false);
  const [lastIntentId, setLastIntentId] = useState<string | null>(null);

  const usdWallet = useMemo(() => wallets.find(w => w.currency === 'USD'), [wallets]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError('');
      const [w, t] = await Promise.all([
        listWallets(),
        listWalletTransactions(),
      ]);
      setWallets(w);
      setTxs(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onCreateDeposit = async () => {
    const cents = Math.round((parseFloat(amount) || 0) * 100);
    if (cents <= 0) {
      setError('Enter a valid deposit amount');
      return;
    }
    try {
      setCreating(true);
      const { intent, checkout_url } = await createCryptoIntent(cents);
      setLastIntentId(intent.id);
      // For mock provider, just open the URL (demo page) in a new tab
      window.open(checkout_url, '_blank');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create deposit');
    } finally {
      setCreating(false);
    }
  };

  const onConfirmLastIntent = async () => {
    if (!lastIntentId) return;
    try {
      await confirmCryptoIntent(lastIntentId);
      setLastIntentId(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to confirm payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Wallet</h1>
      </div>

      {loading ? (
        <div className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg">Loading...</div>
      ) : (
        <>
          {error && (
            <div className="p-4 border border-red-300 text-red-700 bg-red-50 rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">USD Balance</div>
              <div className="mt-2 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                ${usdWallet ? centsToUSD(usdWallet.balance_cents) : '0.00'}
              </div>
            </div>

            <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 md:col-span-2">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Deposit amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10.00"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onCreateDeposit}
                    disabled={creating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? 'Creating…' : 'Create Deposit (Mock)'}
                  </button>
                  <button
                    type="button"
                    onClick={onConfirmLastIntent}
                    disabled={!lastIntentId}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Confirm Last Intent
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Recent Transactions</h2>
            {txs.length === 0 ? (
              <div className="text-neutral-500">No transactions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-600 dark:text-neutral-400">
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Reference</th>
                      <th className="py-2 pr-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs.map(tx => (
                      <tr key={tx.id} className="border-t border-neutral-100 dark:border-neutral-800">
                        <td className="py-2 pr-4 capitalize">{tx.type}</td>
                        <td className="py-2 pr-4">${centsToUSD(tx.amount_cents)}</td>
                        <td className="py-2 pr-4">{tx.reference || '-'}</td>
                        <td className="py-2 pr-4">{new Date(tx.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WalletPage;
