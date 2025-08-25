import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTemplates, deleteTemplate, updateTemplate, type InvoiceTemplate } from '@/lib/api';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert-1';
import { XCircle, Grid, List, Eye, Edit } from 'lucide-react';

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [local, setLocal] = useState<Record<string, { name: string; notes: string; tax_rate: number }>>({});
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('list');

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

  const builtInTemplates = [
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
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Templates</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Choose from built-in templates or manage your custom templates
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode('gallery')}
            className={`p-2 rounded-md ${viewMode === 'gallery' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Built-in Templates */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Built-in Templates</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <Link to="/dashboard/create-invoice?template=1" className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">Use Simple</Link>
          <Link to="/dashboard/create-invoice?template=2" className="text-sm px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Use Detailed</Link>
          <Link to="/dashboard/create-invoice?template=3" className="text-sm px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700">Use Pro-forma</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {builtInTemplates.map(template => (
            <Link 
              key={template.id} 
              to={`/templates/${template.id}`}
              className="group block rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`h-24 ${template.color} rounded-t-xl relative overflow-hidden`}>
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
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {template.name}
                  </h4>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-neutral-400" />
                    <Edit className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {template.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Custom Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Your Custom Templates</h2>
          <Link 
            to="/dashboard/create-invoice" 
            className="text-sm text-blue-600 hover:underline"
          >
            Create new template
          </Link>
        </div>

        {loading && <div className="text-neutral-600 dark:text-neutral-400">Loading templates...</div>}
        
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
          <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">No custom templates yet.</p>
            <Link 
              to="/dashboard/create-invoice" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="h-4 w-4" />
              Create your first template
            </Link>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="grid grid-cols-1 gap-4">
            {templates.map((t) => {
              const l = local[t.id] || { name: t.name, notes: t.notes || '', tax_rate: t.tax_rate };
              const saving = !!savingIds[t.id];
              return (
                <div key={t.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          className="text-lg font-semibold w-full border-b border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:border-blue-500 text-neutral-900 dark:text-neutral-100"
                          value={l.name}
                          onChange={(e) => setLocal(prev => ({ ...prev, [t.id]: { ...l, name: e.target.value } }))}
                        />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{new Date(t.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{t.items.length} item{t.items.length === 1 ? '' : 's'} · Tax {l.tax_rate}%</div>
                      <div className="mt-3">
                        <label className="text-sm text-neutral-700 dark:text-neutral-300">Notes</label>
                        <textarea
                          className="mt-1 w-full border border-neutral-200 dark:border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                          rows={3}
                          value={l.notes}
                          onChange={(e) => setLocal(prev => ({ ...prev, [t.id]: { ...l, notes: e.target.value } }))}
                        />
                      </div>
                      <div className="mt-3">
                        <label className="text-sm text-neutral-700 dark:text-neutral-300">Tax rate (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          className="mt-1 w-32 border border-neutral-200 dark:border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                          value={l.tax_rate}
                          onChange={(e) => setLocal(prev => ({ ...prev, [t.id]: { ...l, tax_rate: parseFloat(e.target.value) || 0 } }))}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col md:w-auto w-full gap-2">
                      <Link
                        to={`/dashboard/create-invoice?template=${t.id}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 md:w-auto w-full"
                      >Use Template</Link>
                      <button
                        onClick={() => onSave(t.id)}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60 hover:bg-blue-700 md:w-auto w-full"
                      >{saving ? 'Saving...' : 'Save'}</button>
                      <button
                        onClick={() => onDelete(t.id)}
                        className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 md:w-auto w-full"
                      >Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
