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
    <div className="space-y-6">
      {/* Greeting and plan badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Welcome back, {user?.name}!</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Here’s what’s happening with your invoices</p>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          {user?.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
        </span>
      </div>

      {error && (
        <div className="mx-auto max-w-2xl">
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

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map((i) => {
          const isLoading = invoices === null;
          const content = [
            { label: 'Total Invoices', value: metrics.totalCount, color: 'text-blue-600' },
            { label: 'Total Amount', value: `$${(metrics.totalAmountCents/100).toFixed(2)}`, color: 'text-green-600' },
            { label: 'Pending', value: metrics.pendingCount, color: 'text-yellow-600' },
            { label: 'Customers', value: invoices ? new Set(invoices.map(i=>i.customer)).size : '—', color: 'text-purple-600' },
          ][i];
          return (
            <div key={i} className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border border-neutral-200/60 dark:border-neutral-700/60 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">{content.label}</div>
              <div className={`mt-2 text-2xl font-semibold ${content.color}`}>
                {isLoading ? (
                  <div className="h-7 w-24 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                ) : (
                  content.value as React.ReactNode
                )}
              </div>
              <div className="mt-1 text-xs text-neutral-400">This month</div>
            </div>
          );
        })}
      </div>

      {/* Invoice Templates */}
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-neutral-200/60 dark:border-neutral-700/60 rounded-lg shadow-sm">
        <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200">Invoice Templates</h3>
          <Link to="/templates" className="text-sm text-blue-600 hover:underline">View all templates</Link>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { 
              id: 1, 
              name: 'Simple Invoice', 
              description: 'Clean & minimal design for basic invoicing', 
              color: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30',
              accent: 'bg-blue-500',
              pattern: 'simple'
            },
            { 
              id: 2, 
              name: 'Detailed Invoice', 
              description: 'Comprehensive layout with itemized billing', 
              color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30',
              accent: 'bg-emerald-500',
              pattern: 'detailed'
            },
            { 
              id: 3, 
              name: 'Pro-forma Invoice', 
              description: 'Professional estimates and quotes', 
              color: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30',
              accent: 'bg-purple-500',
              pattern: 'proforma'
            }
          ].map(template => (
            <Link 
              key={template.id} 
              to={`/templates/${template.id}`}
              className="group block rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`h-24 ${template.color} rounded-t-xl relative overflow-hidden`}>
                {/* Different template preview patterns */}
                <div className="absolute inset-3 bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
                  {template.pattern === 'simple' && (
                    <div className="p-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="h-1.5 w-12 bg-neutral-800 dark:bg-neutral-200 rounded" />
                        <div className={`h-1.5 w-6 ${template.accent} rounded`} />
                      </div>
                      <div className="h-0.5 w-16 bg-neutral-300 dark:bg-neutral-600 rounded" />
                      <div className="mt-2 space-y-0.5">
                        <div className="h-0.5 w-8 bg-neutral-200 dark:bg-neutral-700 rounded" />
                        <div className="h-0.5 w-10 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      </div>
                    </div>
                  )}
                  {template.pattern === 'detailed' && (
                    <div className="p-2 space-y-1">
                      <div className="flex justify-between">
                        <div className="space-y-0.5">
                          <div className="h-1 w-8 bg-neutral-800 dark:bg-neutral-200 rounded" />
                          <div className="h-0.5 w-12 bg-neutral-300 dark:bg-neutral-600 rounded" />
                        </div>
                        <div className={`h-2 w-2 ${template.accent} rounded`} />
                      </div>
                      <div className="grid grid-cols-3 gap-0.5 mt-1">
                        <div className="h-0.5 bg-neutral-200 dark:bg-neutral-700 rounded" />
                        <div className="h-0.5 bg-neutral-200 dark:bg-neutral-700 rounded" />
                        <div className="h-0.5 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      </div>
                      <div className="grid grid-cols-3 gap-0.5">
                        <div className="h-0.5 bg-neutral-300 dark:bg-neutral-600 rounded" />
                        <div className="h-0.5 bg-neutral-300 dark:bg-neutral-600 rounded" />
                        <div className="h-0.5 bg-neutral-300 dark:bg-neutral-600 rounded" />
                      </div>
                    </div>
                  )}
                  {template.pattern === 'proforma' && (
                    <div className="p-2 space-y-1">
                      <div className="text-center">
                        <div className="h-1 w-10 bg-neutral-800 dark:bg-neutral-200 rounded mx-auto" />
                        <div className="h-0.5 w-8 bg-neutral-400 dark:bg-neutral-500 rounded mx-auto mt-0.5" />
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <div className="space-y-0.5">
                          <div className="h-0.5 w-6 bg-neutral-200 dark:bg-neutral-700 rounded" />
                          <div className="h-0.5 w-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                        </div>
                        <div className={`h-1.5 w-4 ${template.accent} rounded`} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                  {template.name}
                </h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {template.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent invoices */}
        <div className="lg:col-span-8">
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-neutral-200/60 dark:border-neutral-700/60 rounded-lg shadow-sm">
            <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Recent Invoices</h3>
              <Link to="/dashboard/invoices" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="p-4">
              {invoices === null ? (
                <div className="space-y-3">
                  {Array.from({length:5}).map((_,i) => (
                    <div key={i} className="h-10 w-full rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-10 text-sm text-neutral-500 dark:text-neutral-400">
                  No invoices yet. <Link to="/dashboard/create-invoice" className="text-blue-600 hover:underline">Create your first invoice</Link>.
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-neutral-500 dark:text-neutral-400">
                          <th className="py-2">Customer</th>
                          <th className="py-2">Amount</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Date</th>
                          <th className="py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.slice(0,5).map(inv => (
                          <tr key={inv.id} className="border-t border-neutral-100 dark:border-neutral-800">
                            <td className="py-2 font-medium text-neutral-800 dark:text-neutral-200">{inv.customer}</td>
                            <td className="py-2">{inv.currency}{(Number(inv.amount)/100).toFixed(2)}</td>
                            <td className="py-2">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${inv.status==='paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : inv.status==='pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-2 text-neutral-500 dark:text-neutral-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                            <td className="py-2 text-right">
                              <Link to={`/dashboard/invoices`} className="text-blue-600 hover:underline">View</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile list */}
                  <div className="md:hidden divide-y divide-neutral-200 dark:divide-neutral-800">
                    {invoices.slice(0,5).map(inv => (
                      <div key={inv.id} className="py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">{inv.customer}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(inv.created_at).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{inv.currency}{(Number(inv.amount)/100).toFixed(2)}</div>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium mt-1 ${inv.status==='paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : inv.status==='pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}`}>{inv.status}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Link to={`/dashboard/invoices`} className="text-xs text-blue-600 hover:underline">View</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Side widgets */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-neutral-200/60 dark:border-neutral-700/60 rounded-lg shadow-sm">
            <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Quick Actions</h3>
            </div>
            <div className="p-4 grid gap-2">
              <Link to="/dashboard/create-invoice" className="rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">Create invoice</Link>
              <Link to="/templates" className="rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">Browse templates</Link>
              <Link to="/customers" className="rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">Add customer</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
