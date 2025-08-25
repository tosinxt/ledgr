import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { InvoiceItem } from '../types';
import { apiFetch, listTemplates, type InvoiceTemplate } from '@/lib/api';
import { Alert, AlertContent, AlertDescription, AlertIcon } from '@/components/ui/alert-1';
import { CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react';
import { getSettings } from '@/lib/settings';

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Load defaults from saved settings
  const settings = getSettings();
  const currency = (settings.currency || 'USD').toUpperCase();
  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'NGN':
        return '₦';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return code + ' ';
    }
  };
  const currencySymbol = getCurrencySymbol(currency);
  // Form state
  const [formData, setFormData] = useState({
    companyName: settings.companyName || '',
    companyAddress: settings.companyAddress || '',
    clientName: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    taxRate: typeof settings.defaultTaxRate === 'number' ? settings.defaultTaxRate : 10,
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
  ]);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Apply template if provided via query param (?template=<id>)
  useEffect(() => {
    const t = searchParams.get('template');
    if (!t) return;

    const applyBuiltIn = (kind: '1' | '2' | '3') => {
      if (kind === '1') {
        // Simple
        const its = [
          { id: '1', description: 'Web Development Services', quantity: 1, rate: 2500.0, amount: 2500.0 },
        ];
        setItems(its as InvoiceItem[]);
        setFormData(prev => ({ ...prev, taxRate: 0, notes: 'Clean & minimal design for basic invoicing' }));
      } else if (kind === '2') {
        // Detailed
        const i1 = { id: '1', description: 'Website Design & Development', quantity: 1, rate: 2500.0, amount: 2500.0 };
        const i2 = { id: '2', description: 'SEO Optimization', quantity: 1, rate: 500.0, amount: 500.0 };
        setItems([i1, i2] as InvoiceItem[]);
        setFormData(prev => ({ ...prev, taxRate: 8.5, notes: 'Comprehensive layout with itemized billing' }));
      } else if (kind === '3') {
        // Pro-forma
        const i1 = { id: '1', description: 'Complete Brand Identity Package', quantity: 1, rate: 3500.0, amount: 3500.0 };
        const i2 = { id: '2', description: 'Website Development', quantity: 1, rate: 4200.0, amount: 4200.0 };
        setItems([i1, i2] as InvoiceItem[]);
        setFormData(prev => ({ ...prev, taxRate: 0, notes: 'This quote is valid for 30 days. Final invoice may vary based on scope changes.' }));
      }
    };

    const applyCustom = async (id: string) => {
      try {
        const templates = await listTemplates();
        const match = templates.find((tpl: InvoiceTemplate) => tpl.id === id);
        if (!match) return;
        const its: InvoiceItem[] = (match.items || []).map((it, idx) => ({
          id: String(idx + 1),
          description: it.description,
          quantity: it.quantity,
          rate: it.rate,
          amount: it.quantity * it.rate,
        }));
        setItems(its);
        setFormData(prev => ({ ...prev, taxRate: match.tax_rate, notes: match.notes || '' }));
      } catch {
        // ignore if fetch fails
      }
    };

    if (t === '1' || t === '2' || t === '3') {
      applyBuiltIn(t);
    } else {
      applyCustom(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = () => {
    const newId = (items.length + 1).toString();
    setItems([...items, { id: newId, description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * formData.taxRate) / 100;
  const total = subtotal + taxAmount;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    // Map UI fields to backend invoice payload
    const amountCents = Math.round((subtotal + taxAmount) * 100);
    if (amountCents <= 0) {
      setErrorMsg('Invoice total must be greater than 0 before creating. Add at least one item with a positive amount.');
      return;
    }
    const payload = {
      // Backend schema expects these fields
      currency: settings.currency || 'USD',
      customer: formData.clientName,
      // amount is optional; server computes from items + tax_rate when provided
      items: items.map(it => ({ description: it.description, quantity: it.quantity, rate: it.rate })),
      tax_rate: formData.taxRate,
      notes: formData.notes || undefined,
      company_name: formData.companyName || undefined,
      company_address: formData.companyAddress || undefined,
      issue_date: formData.issueDate || undefined,
      due_date: formData.dueDate || undefined,
    } as const;
    try {
      setSubmitting(true);
      const res = await apiFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create invoice');
      }
      setSuccessMsg('Invoice created successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard/invoices'), 600);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create invoice');
    }
    finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {(errorMsg || successMsg) && (
            <Alert
              variant={errorMsg ? 'destructive' : 'success'}
              appearance="light"
              size="md"
            >
              <AlertIcon>
                {errorMsg ? <XCircle /> : <CheckCircle2 />}
              </AlertIcon>
              <AlertContent>
                <AlertDescription>
                  {errorMsg || successMsg}
                </AlertDescription>
              </AlertContent>
            </Alert>
          )}

          {/* Company & Client Information */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Invoice Details</h2>
              <span className="inline-flex items-center gap-2 text-sm px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                <span className="opacity-70">Currency</span>
                <strong>{currency}</strong>
                <span>({currencySymbol})</span>
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Company Address</label>
                <input
                  type="text"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Business St, City, ST 12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Client Name</label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Issue Date</label>
              <input
                type="date"
                required
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Due Date</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Invoice Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <div className="col-span-12 sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Description"
                      required
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      placeholder={`Rate (${currencySymbol})`}
                      min="0"
                      step="0.01"
                      required
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <input
                      type="text"
                      value={`${currencySymbol}${item.amount.toFixed(2)}`}
                      readOnly
                      className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Notes */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Tax & Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-32 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes or payment terms..."
                />
              </div>
            </div>
          </div>

          {/* Invoice Summary */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Invoice Summary</h2>
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="space-y-3">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal:</span>
                  <span>{`${currencySymbol}${subtotal.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Tax ({formData.taxRate}%):</span>
                  <span>{`${currencySymbol}${taxAmount.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-neutral-900 dark:text-neutral-100 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                  <span>Total:</span>
                  <span>{`${currencySymbol}${total.toFixed(2)}`}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || total === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
    </div>
  );

};

export default CreateInvoice;