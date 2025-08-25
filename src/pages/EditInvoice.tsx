import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, AlertContent, AlertDescription, AlertIcon } from '@/components/ui/alert-1';
import { CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { InvoiceItem } from '../types';

interface InvoiceItemDto { description: string; quantity: number; rate: number; amount?: number }
interface InvoiceDto {
  id: string;
  currency: string;
  customer: string;
  company_name?: string | null;
  company_address?: string | null;
  client_email?: string | null;
  client_address?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  notes?: string | null;
  tax_rate?: number | null;
  amount?: number | null;
  items?: InvoiceItemDto[] | null;
}

const EditInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [currency, setCurrency] = useState('USD');
  const [customer, setCustomer] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) throw new Error('Missing invoice id');
        const res = await apiFetch(`/api/invoices/${id}`);
        if (!res.ok) throw new Error(await res.text());
        const inv: InvoiceDto = await res.json();
        if (!mounted) return;
        setCurrency(inv.currency || 'USD');
        setCustomer(inv.customer || '');
        setCompanyName(inv.company_name || '');
        setCompanyAddress(inv.company_address || '');
        setClientEmail(inv.client_email || '');
        setClientAddress(inv.client_address || '');
        setIssueDate(inv.issue_date ? String(inv.issue_date).slice(0, 10) : '');
        setDueDate(inv.due_date ? String(inv.due_date).slice(0, 10) : '');
        setNotes(inv.notes || '');
        setTaxRate(typeof inv.tax_rate === 'number' ? inv.tax_rate : 0);
        const mapped = (inv.items || []).map((it, idx) => ({ id: String(idx + 1), description: it.description, quantity: it.quantity, rate: it.rate, amount: (it.amount ?? it.quantity * it.rate) }));
        setItems(mapped.length ? mapped : [{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }]);
      } catch (e: any) {
        setErrorMsg(e?.message || 'Failed to load invoice');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const addItem = () => {
    const newId = (items.length + 1).toString();
    setItems([...items, { id: newId, description: '', quantity: 1, rate: 0, amount: 0 }]);
  };
  const removeItem = (rowId: string) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== rowId));
  };
  const updateItem = (rowId: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(it => {
      if (it.id === rowId) {
        const n = { ...it, [field]: value } as InvoiceItem;
        if (field === 'quantity' || field === 'rate') n.amount = n.quantity * n.rate;
        return n;
      }
      return it;
    }));
  };

  const subtotal = useMemo(() => items.reduce((s, it) => s + (it.amount || 0), 0), [items]);
  const taxAmount = useMemo(() => subtotal * (Number(taxRate || 0) / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!id) return;
    try {
      setSaving(true);
      const payload: any = {
        currency,
        customer,
        items: items.map(it => ({ description: it.description, quantity: it.quantity, rate: it.rate })),
        tax_rate: taxRate,
        notes: notes || undefined,
        company_name: companyName || undefined,
        company_address: companyAddress || undefined,
        client_email: clientEmail || undefined,
        client_address: clientAddress || undefined,
        issue_date: issueDate || undefined,
        due_date: dueDate || undefined,
      };
      const res = await apiFetch(`/api/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      setSuccessMsg('Invoice updated');
      setTimeout(() => navigate(`/dashboard/invoices/${id}`), 600);
    } catch (e: any) {
      let msg = e?.message || 'Failed to update invoice';
      try {
        if (msg.trim().startsWith('{')) {
          const p = JSON.parse(msg);
          if (p?.error) msg = p.error;
        }
      } catch {}
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-neutral-600 dark:text-neutral-300">Loading…</div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700">
      <form onSubmit={onSubmit} className="p-8 space-y-6">
        {(errorMsg || successMsg) && (
          <Alert variant={errorMsg ? 'destructive' : 'success'} appearance="light" size="md">
            <AlertIcon>{errorMsg ? <XCircle /> : <CheckCircle2 />}</AlertIcon>
            <AlertContent>
              <AlertDescription>{errorMsg || successMsg}</AlertDescription>
            </AlertContent>
          </Alert>
        )}

        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Edit Invoice</h2>
          <div className="text-sm text-neutral-500">Total: <strong className="text-neutral-900 dark:text-neutral-100">{currency} {(total).toFixed(2)}</strong></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Company Address</label>
            <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Client Name</label>
            <input required value={customer} onChange={e => setCustomer(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Client Email</label>
            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Client Address</label>
            <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <input value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} className="w-40 border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Issue Date</label>
            <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold">Items</h3>
            <button type="button" onClick={addItem} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Item</button>
          </div>
          <div className="space-y-4">
            {items.map(it => (
              <div key={it.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-neutral-50 dark:bg-neutral-800/50 border rounded-lg">
                <div className="col-span-12 sm:col-span-5">
                  <input required value={it.description} onChange={e => updateItem(it.id, 'description', e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Description" />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input type="number" min={1} value={it.quantity} onChange={e => updateItem(it.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2" placeholder="Qty" />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input type="number" min={0} step="0.01" value={it.rate} onChange={e => updateItem(it.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2" placeholder="Rate" />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <input readOnly value={it.amount?.toFixed(2) || '0.00'} className="w-full border rounded-lg px-3 py-2 bg-neutral-50" />
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(it.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
            <input type="number" min={0} max={100} step={0.1} value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-32 border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Additional notes or payment terms..." />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
};

export default EditInvoice;
