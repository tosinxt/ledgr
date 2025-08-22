import React, { useEffect, useState } from 'react';
import type { InvoiceTemplate } from '@/lib/api';
import { getJSONCached } from '@/lib/api';

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (t: InvoiceTemplate) => void;
};

const TemplatePicker: React.FC<Props> = ({ open, onClose, onApply }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);

  useEffect(() => {
    if (!open) return;
    setError('');
    setLoading(true);
    // Cache templates briefly to make repeated opens instant
    getJSONCached<{ templates: InvoiceTemplate[] }>('templates:list', '/api/templates', 60_000)
      .then((res) => setTemplates(res.templates || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load templates'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Choose a Template</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {loading && <div className="text-sm text-gray-600">Loading templates...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && !error && templates.length === 0 && (
            <div className="text-sm text-gray-600">No templates yet. Save one from your invoice form.</div>
          )}
          {!loading && !error && templates.map((t) => (
            <div key={t.id} className="border rounded-md p-3 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.items.length} item{t.items.length === 1 ? '' : 's'} · Tax {t.tax_rate}%</div>
                  {t.notes && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{t.notes}</div>}
                </div>
                <button
                  onClick={() => { onApply(t); onClose(); }}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePicker;
