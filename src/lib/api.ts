import { supabase } from '@/lib/supabase';
import { getJSONCache, setJSONCache, getBlobCache, setBlobCache } from '@/lib/cache';

export async function apiFetch(input: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  const baseHeaders: HeadersInit = {
    ...(init.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  } as HeadersInit;

  // Only set JSON content-type if we are sending a JSON body
  const shouldSetJson = !!init.body && !(init.body instanceof FormData) && !(init.body instanceof Blob);
  const headers: HeadersInit = shouldSetJson ? { 'Content-Type': 'application/json', ...baseHeaders } : baseHeaders;

  return fetch(input, { ...init, headers });
}

export async function getJSON<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(input, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

// Cached JSON with TTL (ms)
export async function getJSONCached<T>(key: string, input: string, ttlMs: number, init?: RequestInit): Promise<T> {
  const cached = getJSONCache<T>(key);
  if (cached) return cached;
  const data = await getJSON<T>(input, init);
  setJSONCache(key, data, ttlMs);
  return data;
}

// Cached Blob with TTL (ms)
export async function fetchBlobCached(key: string, input: string, ttlMs: number, init?: RequestInit): Promise<{ blob: Blob; filename?: string; res: Response }> {
  const hit = getBlobCache(key);
  if (hit) return { blob: hit.blob, filename: hit.filename, res: new Response(hit.blob) };
  const res = await apiFetch(input, init);
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  // We may not have the filename here; caller can also parse headers.
  setBlobCache(key, blob, ttlMs);
  return { blob, res } as { blob: Blob; filename?: string; res: Response };
}

// Template API helpers
export type TemplateItem = { description: string; quantity: number; rate: number };
export type InvoiceTemplate = {
  id: string;
  user_id: string;
  name: string;
  items: TemplateItem[];
  tax_rate: number;
  notes?: string;
  created_at: string;
};

export async function listTemplates(): Promise<InvoiceTemplate[]> {
  const res = await getJSON<{ templates: InvoiceTemplate[] }>('/api/templates');
  return res.templates || [];
}

export async function createTemplate(input: { name: string; items: TemplateItem[]; tax_rate: number; notes?: string }): Promise<InvoiceTemplate> {
  return getJSON<InvoiceTemplate>('/api/templates', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTemplate(id: string, patch: Partial<{ name: string; items: TemplateItem[]; tax_rate: number; notes?: string }>): Promise<InvoiceTemplate> {
  return getJSON<InvoiceTemplate>(`/api/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await apiFetch(`/api/templates/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}

// Extract filename from Content-Disposition header
export function filenameFromContentDisposition(res: Response, fallback: string): string {
  const cd = res.headers.get('content-disposition') || '';
  const match = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const encoded = match?.[1];
  const plain = match?.[2];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      // Fall back to raw encoded value if decoding fails
      return encoded;
    }
  }
  if (plain) return plain;
  return fallback;
}
