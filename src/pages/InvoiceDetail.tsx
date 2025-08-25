import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, AlertContent, AlertDescription, AlertIcon } from '@/components/ui/alert-1';
import { ArrowLeft, CheckCircle2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { apiFetch } from '@/lib/api';

interface InvoiceItemDto { description: string; quantity: number; rate: number; amount?: number }
interface InvoiceDto {
  id: string;
  currency: string;
  customer: string;
  company_name?: string | null;
  company_address?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  notes?: string | null;
  tax_rate?: number | null;
  amount?: number | null;
  items?: InvoiceItemDto[] | null;
  template_kind?: 'simple' | 'detailed' | 'proforma';
}

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'simple' | 'detailed'>('simple');
  const [savingTheme, setSavingTheme] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  const updateTheme = async (next: 'simple' | 'detailed') => {
    if (!id) return;
    if (theme === next) return;
    const prev = theme;
    setTheme(next);
    setSavingTheme(true);
    try {
      const res = await apiFetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_kind: next }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to update template');
      }
      const updated: InvoiceDto = await res.json();
      setInvoice(updated);
    } catch (err: unknown) {
      setTheme(prev);
      const msg = err instanceof Error ? err.message : 'Failed to save theme';
      setError(msg);
      setTimeout(() => setError(''), 2500);
    } finally {
      setSavingTheme(false);
    }
  };

  const handleSendEmail = async () => {
    if (!id) return;
    const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!emailRegex.test(emailTo)) {
      setError('Please enter a valid email address');
      setTimeout(() => setError(''), 2500);
      return;
    }
    try {
      setEmailSending(true);
      const res = await apiFetch('/api/email/send-invoice', {
        method: 'POST',
        body: JSON.stringify({ invoiceId: id, to: emailTo, message: emailMsg || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccessMsg('Invoice email sent');
      setTimeout(() => setSuccessMsg(''), 2500);
      setEmailOpen(false);
      setEmailTo('');
      setEmailMsg('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send invoice email';
      setError(msg);
      setTimeout(() => setError(''), 2500);
    } finally {
      setEmailSending(false);
    }
  };

  const handleShare = async () => {
    if (!id) return;
    try {
      setSharing(true);
      const res = await apiFetch(`/api/invoices/${id}/public-url`);
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      const url: string = body?.url || '';
      if (!url) throw new Error('No URL returned');
      await navigator.clipboard.writeText(url);
      setSuccessMsg('Share link copied to clipboard');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate share link';
      setError(msg);
      setTimeout(() => setError(''), 2500);
    } finally {
      setSharing(false);
    }
  };

  

  useEffect(() => {
    const run = async () => {
      try {
        if (!id) throw new Error('Missing invoice id');
        const res = await apiFetch(`/api/invoices/${id}`);
        if (!res.ok) throw new Error(await res.text());
        const data: InvoiceDto = await res.json();
        setInvoice(data);
        const initial = (data.template_kind === 'detailed') ? 'detailed' : 'simple';
        setTheme(initial);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load invoice';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  // Load company logo URL for branding in preview/PDF
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await apiFetch('/api/settings/company-logo-url');
        if (res.ok) {
          const data = await res.json();
          setLogoUrl(data?.url || null);
        }
      } catch {
        // ignore
      }
    };
    loadLogo();
  }, []);

  const handleExportPdf = async () => {
    try {
      setDownloading(true);
      const node = previewRef.current;
      if (!node) throw new Error('Preview not available');
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 48;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const y = 24;
      if (imgHeight > pageHeight - 48) {
        let hLeft = imgHeight;
        let position = 24;
        while (hLeft > 0) {
          pdf.addImage(imgData, 'PNG', 24, position, imgWidth, imgHeight);
          hLeft -= pageHeight;
          if (hLeft > 0) {
            pdf.addPage();
            position = 24 - (imgHeight - hLeft);
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', 24, y, imgWidth, imgHeight);
      }
      const fileName = `invoice_${invoice?.id || 'export'}.pdf`;
      pdf.save(fileName);
      setSuccessMsg('PDF exported successfully!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch {
      setError('Error generating PDF');
      setTimeout(() => setError(''), 2500);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-neutral-600 dark:text-neutral-300">Loading…</div>;
  }
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" appearance="light" size="sm">
          <AlertIcon>!</AlertIcon>
          <AlertContent>
            <AlertDescription>{error}</AlertDescription>
          </AlertContent>
        </Alert>
      </div>
    );
  }
  if (!invoice) return null;

  const currency = (invoice.currency || 'USD').toUpperCase();
  const symbol = currency === 'NGN' ? '₦' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  const items = invoice.items || [];
  const subtotal = items.reduce((s, it) => s + (it.amount ?? it.quantity * it.rate), 0);
  const taxRate = invoice.tax_rate ?? 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {successMsg && (
          <div className="mb-4">
            <Alert variant="success" appearance="light" size="sm">
              <AlertIcon>
                <CheckCircle2 />
              </AlertIcon>
              <AlertContent>
                <AlertDescription>{successMsg}</AlertDescription>
              </AlertContent>
            </Alert>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Theme slider */}
            <div className="relative bg-neutral-100 dark:bg-neutral-800 rounded-full p-1 flex text-sm">
              <div
                className={`absolute top-1 bottom-1 w-1/2 rounded-full bg-white dark:bg-neutral-700 shadow transition-transform duration-300 ease-out ${theme === 'simple' ? 'translate-x-0' : 'translate-x-full'}`}
                aria-hidden
              />
              <button
                className={`relative z-10 px-3 py-1 rounded-full transition-colors ${theme === 'simple' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}`}
                onClick={() => updateTheme('simple')}
                disabled={savingTheme}
              >
                Simple
              </button>
              <button
                className={`relative z-10 px-3 py-1 rounded-full transition-colors ${theme === 'detailed' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}`}
                onClick={() => updateTheme('detailed')}
                disabled={savingTheme}
              >
                Detailed
              </button>
            </div>
            <button
              onClick={handleExportPdf}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> {downloading ? 'Generating…' : 'Export PDF'}
            </button>
            <button
              onClick={() => setEmailOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              title="Send invoice via email"
            >
              Email
            </button>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
              title="Copy public view link"
            >
              {sharing ? 'Sharing…' : 'Copy Share Link'}
            </button>
            <button
              onClick={() => navigate(`/dashboard/invoices/${id}/edit`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div id="invoice-preview" ref={previewRef} className="bg-white transform scale-100 md:scale-90 origin-top-left min-w-[720px]">
          {theme === 'simple' ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="h-12 w-12 object-contain" />
                  ) : (
                    <div className="h-12 w-12 bg-neutral-200 rounded" />
                  )}
                  <div>
                    <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{invoice.company_name || 'Your Company'}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Invoice • #{invoice.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">Due</div>
                  <div className="text-neutral-900 dark:text-neutral-100">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">From</div>
                  <div className="text-neutral-900 dark:text-neutral-100 font-medium">{invoice.company_name || 'Your Company Name'}</div>
                  <div className="text-neutral-600 dark:text-neutral-400">{invoice.company_address || '123 Business St'}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">Bill To</div>
                  <div className="text-neutral-900 dark:text-neutral-100 font-medium">{invoice.customer}</div>
                </div>
              </div>

              <div className="mb-8">
                <div className="border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4">
                  <div className="grid grid-cols-3 gap-4 font-semibold text-neutral-900 dark:text-neutral-100">
                    <span>Description</span>
                    <span>Qty</span>
                    <span className="text-right">Amount</span>
                  </div>
                </div>
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-4 text-neutral-600 dark:text-neutral-400 mb-2">
                    <span>{it.description}</span>
                    <span>{it.quantity}</span>
                    <span className="text-right">{`${symbol}${(it.amount ?? it.quantity * it.rate).toFixed(2)}`}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400 py-1">
                    <span>Subtotal:</span>
                    <span>{`${symbol}${subtotal.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400 py-1">
                    <span>Tax ({taxRate}%):</span>
                    <span>{`${symbol}${taxAmount.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-neutral-200 dark:border-neutral-700">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">Total:</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{`${symbol}${total.toFixed(2)}`}</span>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
                  <div className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">Notes</div>
                  <div>{invoice.notes}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="h-12 w-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-neutral-200" />
                  )}
                  <div>
                    <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{invoice.company_name || 'Your Company'}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Invoice • #{invoice.id.slice(0,8).toUpperCase()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">Issue</div>
                  <div className="text-neutral-900 dark:text-neutral-100">{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="col-span-2">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">Billed To</div>
                  <div className="text-neutral-900 dark:text-neutral-100 font-medium">{invoice.customer}</div>
                </div>
                <div className="border rounded-lg p-3 border-neutral-200 dark:border-neutral-700">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">Summary</div>
                  <div className="text-neutral-900 dark:text-neutral-100 text-lg font-semibold">{`${symbol}${total.toFixed(2)}`}</div>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="grid grid-cols-12 bg-neutral-50 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-300 text-sm px-4 py-2">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {items.map((it, i) => {
                    const amt = (it.amount ?? it.quantity * it.rate);
                    return (
                      <div key={i} className="grid grid-cols-12 px-4 py-2 text-neutral-700 dark:text-neutral-300">
                        <div className="col-span-6">{it.description}</div>
                        <div className="col-span-2 text-right">{it.quantity}</div>
                        <div className="col-span-2 text-right">{`${symbol}${it.rate.toFixed(2)}`}</div>
                        <div className="col-span-2 text-right">{`${symbol}${amt.toFixed(2)}`}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <div className="w-72">
                  <div className="flex justify-between py-1 text-neutral-600 dark:text-neutral-400">
                    <span>Subtotal</span>
                    <span>{`${symbol}${subtotal.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between py-1 text-neutral-600 dark:text-neutral-400">
                    <span>Tax ({taxRate}%)</span>
                    <span>{`${symbol}${taxAmount.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between py-2 mt-1 border-t border-neutral-200 dark:border-neutral-700">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">Total</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{`${symbol}${total.toFixed(2)}`}</span>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
                  <div className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">Notes</div>
                  <div>{invoice.notes}</div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
      {emailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !emailSending && setEmailOpen(false)} />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Send Invoice via Email</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-neutral-700 dark:text-neutral-300">Recipient Email</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 dark:text-neutral-300">Message (optional)</label>
                <textarea
                  value={emailMsg}
                  onChange={(e) => setEmailMsg(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please find your invoice below."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEmailOpen(false)}
                disabled={emailSending}
                className="px-3 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailSending}
                className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {emailSending ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
