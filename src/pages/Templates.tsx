import React, { useEffect, useMemo, useState } from 'react';
import { listTemplates, deleteTemplate, updateTemplate, type InvoiceTemplate } from '@/lib/api';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert-1';
import { XCircle } from 'lucide-react';

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [local, setLocal] = useState<Record<string, { name: string; notes: string; tax_rate: number }>>({});

  const fetchAll = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await listTemplates();
      setTemplates(data);
      const map: Record<string, { name: string; notes: string; tax_rate: number }> = {};
      data.forEach(t => {
        map[t.id] = { name: t.name, notes: t.notes || '', tax_rate: t.tax_rate };
      });
      setLocal(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const count = useMemo(() => templates.length, [templates]);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    try {
      await deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete template');
    }
  };

  const onSave = async (id: string) => {
    const patch = local[id];
    if (!patch) return;
    try {
      setSavingIds(s => ({ ...s, [id]: true }));
      const updated = await updateTemplate(id, { name: patch.name, notes: patch.notes, tax_rate: patch.tax_rate });
      setTemplates(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update template');
    } finally {
      setSavingIds(s => ({ ...s, [id]: false }));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your invoice templates. Create new templates from the Create Invoice page via "Save as Template".</p>
      </div>

      {loading && <div className="text-gray-600">Loading templates...</div>}
      {error && (
        <div className="mb-4">
          <Alert variant="destructive" appearance="light" close onClose={() => setError('')}>
            <AlertIcon>
              <XCircle className="text-destructive" />
            </AlertIcon>
            <AlertContent>
              <AlertTitle>Failed to load templates</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </AlertContent>
          </Alert>
        </div>
      )}

      {!loading && count === 0 && (
        <div className="text-gray-600">No templates yet.</div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {templates.map((t) => {
          const l = local[t.id] || { name: t.name, notes: t.notes || '', tax_rate: t.tax_rate };
          const saving = !!savingIds[t.id];
          return (
            <div key={t.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      className="text-lg font-semibold w-full border-b focus:outline-none focus:border-blue-500"
                      value={l.name}
                      onChange={(e) => setLocal(prev => ({ ...prev, [t.id]: { ...l, name: e.target.value } }))}
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(t.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{t.items.length} item{t.items.length === 1 ? '' : 's'} · Tax {l.tax_rate}%</div>
                  <div className="mt-3">
                    <label className="text-sm text-gray-700">Notes</label>
                    <textarea
                      className="mt-1 w-full border rounded-md p-2 text-sm focus:outline-none focus:border-blue-500"
                      rows={3}
                      value={l.notes}
                      onChange={(e) => setLocal(prev => ({ ...prev, [t.id]: { ...l, notes: e.target.value } }))}
                    />
                  </div>
                  <div className="mt-3">
                    <label className="text-sm text-gray-700">Tax rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      className="mt-1 w-32 border rounded-md p-2 text-sm focus:outline-none focus:border-blue-500"
                      value={l.tax_rate}
                      onChange={(e) => setLocal(prev => ({ ...prev, [t.id]: { ...l, tax_rate: parseFloat(e.target.value) || 0 } }))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onSave(t.id)}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60 hover:bg-blue-700"
                  >{saving ? 'Saving...' : 'Save'}</button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                  >Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Templates;
