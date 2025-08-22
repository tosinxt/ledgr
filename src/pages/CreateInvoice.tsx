import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InvoiceItem } from '../types';
import { apiFetch, createTemplate, type InvoiceTemplate } from '@/lib/api';
import TemplatePicker from '@/components/TemplatePicker';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert-1';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    taxRate: 10
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const applyTemplate = (t: InvoiceTemplate) => {
    // Map template items (no id/amount) to UI items with id and computed amount
    const mapped: InvoiceItem[] = t.items.map((it, idx) => ({
      id: String(idx + 1),
      description: it.description,
      quantity: it.quantity,
      rate: it.rate,
      amount: it.quantity * it.rate,
    }));
    setItems(mapped.length ? mapped : [{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }]);
    setFormData((prev) => ({ ...prev, taxRate: t.tax_rate ?? prev.taxRate, notes: t.notes || '' }));
    setErrorMsg('');
    setSuccessMsg(`Applied template: ${t.name}`);
    setTimeout(() => setSuccessMsg(''), 1200);
  };

  const onSaveAsTemplate = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const name = window.prompt('Template name');
    if (!name) return;
    try {
      const payload = {
        name,
        items: items.map(it => ({ description: it.description, quantity: it.quantity, rate: it.rate })),
        tax_rate: formData.taxRate,
        notes: formData.notes || undefined,
      };
      await createTemplate(payload);
      setSuccessMsg('Template saved');
      setTimeout(() => setSuccessMsg(''), 1200);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to save template');
    }
  };

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
      // Amount optional: server will compute from items + tax_rate if provided
      amount: amountCents,
      currency: 'USD',
      customer: formData.clientName || 'Customer',
      items: items.map(it => ({ description: it.description, quantity: it.quantity, rate: it.rate })),
      tax_rate: formData.taxRate,
      notes: formData.notes || undefined,
      company_name: formData.companyName || undefined,
      company_address: formData.companyAddress || undefined,
      client_email: formData.clientEmail || undefined,
      client_address: formData.clientAddress || undefined,
      issue_date: formData.issueDate || undefined,
      due_date: formData.dueDate || undefined,
    };
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {(errorMsg || successMsg) && (
            <Alert
              variant={errorMsg ? 'destructive' : 'success'}
              appearance="light"
              size="md"
              close
              onClose={() => {
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <AlertIcon>
                {errorMsg ? <XCircle className="text-destructive" /> : <CheckCircle2 className="text-[var(--color-success-foreground,var(--color-green-600))]" />}
              </AlertIcon>
              <AlertContent>
                <AlertTitle>{errorMsg ? 'Something went wrong' : 'Success'}</AlertTitle>
                <AlertDescription>{successMsg || errorMsg}</AlertDescription>
              </AlertContent>
            </Alert>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Address</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Name</label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Email</label>
                  <input
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Address</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Issue Date</label>
              <input
                type="date"
                required
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50"
                >
                  Load Template
                </button>
                <button
                  type="button"
                  onClick={onSaveAsTemplate}
                  className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50"
                >
                  Save as Template
                </button>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Item
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-4 border border-gray-200 rounded-md">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Description"
                      required
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Rate"
                      min="0"
                      step="0.01"
                      required
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={`$${item.amount.toFixed(2)}`}
                      readOnly
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
              className="mt-1 block w-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or payment terms..."
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({formData.taxRate}%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {total === 0 && (
              <div className="mt-2">
                <Alert variant="warning" appearance="light" size="sm">
                  <AlertIcon>
                    <Info />
                  </AlertIcon>
                  <AlertContent>
                    <AlertDescription>
                      Please add items to the invoice to proceed.
                    </AlertDescription>
                  </AlertContent>
                </Alert>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || total === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
      <TemplatePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onApply={applyTemplate} />
    </div>
  );

};

export default CreateInvoice;