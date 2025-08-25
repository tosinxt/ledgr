import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

const Themes: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'simple' | 'detailed'>('simple');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/api/settings/company-logo-url');
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setLogoUrl(data?.url || null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load company logo');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Invoice Themes</h2>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded border ${theme === 'simple' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-300 dark:border-neutral-700'}`}
            onClick={() => setTheme('simple')}
          >Simple</button>
          <button
            className={`px-3 py-1 rounded border ${theme === 'detailed' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-300 dark:border-neutral-700'}`}
            onClick={() => setTheme('detailed')}
          >Detailed</button>
        </div>
      </div>

      {loading && <div>Loading preview…</div>}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {!loading && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="max-w-[900px] mx-auto">
            {/* Preview area */}
            <div className="bg-white text-neutral-900 shadow-sm border border-neutral-200 rounded p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="h-12 w-12 object-contain" />
                  ) : (
                    <div className="h-12 w-12 bg-neutral-200 rounded" />
                  )}
                  <div>
                    <div className="text-lg font-semibold">Your Company LLC</div>
                    <div className="text-sm text-neutral-500">hello@company.com</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">INVOICE</div>
                  <div className="text-sm text-neutral-500">#INV-0001</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Bill To</div>
                  <div className="font-medium">Jane Doe</div>
                  <div className="text-sm text-neutral-600">jane@example.com</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-500 mb-1">Date</div>
                  <div className="font-medium">2025-08-25</div>
                </div>
              </div>

              {theme === 'simple' ? (
                <div className="">
                  <div className="flex justify-between py-3 border-t border-neutral-200">
                    <div>Service</div>
                    <div className="font-medium">$500.00</div>
                  </div>
                  <div className="flex justify-between py-3 border-t border-neutral-200">
                    <div>Tax</div>
                    <div className="font-medium">$50.00</div>
                  </div>
                  <div className="flex justify-between py-3 border-t border-neutral-200">
                    <div className="font-semibold">Total</div>
                    <div className="font-semibold">$550.00</div>
                  </div>
                </div>
              ) : (
                <div className="">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2">Item</th>
                        <th>Description</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Rate</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Design</td>
                        <td>Landing page redesign</td>
                        <td className="text-right">10</td>
                        <td className="text-right">$50.00</td>
                        <td className="text-right">$500.00</td>
                      </tr>
                      <tr>
                        <td className="py-2">Tax</td>
                        <td>VAT 10%</td>
                        <td className="text-right">-</td>
                        <td className="text-right">-</td>
                        <td className="text-right">$50.00</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="text-right font-semibold py-2">Total</td>
                        <td className="text-right font-semibold">$550.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Themes;
