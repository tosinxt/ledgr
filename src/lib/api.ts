import { getJSONCache, setJSONCache, getBlobCache, setBlobCache } from '@/lib/cache';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// Simple module-scoped access token with localStorage persistence (Safari-friendly Authorization header)
let ACCESS_TOKEN: string | null = null;
try {
  ACCESS_TOKEN = localStorage.getItem('ledgr:accessToken');
} catch {}

export function setAccessToken(token: string | null) {
  ACCESS_TOKEN = token;
  try {
    if (token) localStorage.setItem('ledgr:accessToken', token);
    else localStorage.removeItem('ledgr:accessToken');
  } catch {}
}

export function getAccessToken(): string | null {
  return ACCESS_TOKEN;
}

function resolveUrl(input: string): string {
  // If input is an absolute URL (http/https) or protocol-relative, leave it
  if (/^https?:\/\//i.test(input)) return input;
  // If starts with '/', prefix with API_BASE (e.g., https://backend-04a2.onrender.com)
  if (input.startsWith('/')) return `${API_BASE}${input}`;
  // Otherwise return as-is
  return input;
}

// Email Settings API
export type EmailSettings = {
  fromName?: string;
  fromEmail?: string;
  brandName?: string;
  replyTo?: string;
};

export type EmailStatus = {
  ok: boolean;
  smtp: { host: boolean; user: boolean; pass: boolean; verified: boolean };
};

export async function fetchEmailSettings(): Promise<EmailSettings> {
  const res = await getJSON<{ ok: boolean; settings: EmailSettings }>(`/api/email/settings`);
  return res.settings || {};
}

export async function updateEmailSettings(patch: EmailSettings): Promise<void> {
  await getJSON(`/api/email/settings`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function getEmailStatus(): Promise<EmailStatus> {
  return getJSON<EmailStatus>(`/api/email/status`);
}

export async function sendTestEmail(to: string, message?: string): Promise<void> {
  await getJSON(`/api/email/send-test`, {
    method: 'POST',
    body: JSON.stringify({ to, message }),
  });
}

export async function fetchCompanyLogoUrl(): Promise<string | null> {
  const res = await getJSON<{ url: string | null }>(`/api/settings/company-logo-url`);
  return res.url ?? null;
}

// Profile API helpers
export type UserProfile = {
  id: string;
  name?: string | null;
  plan: string;
  settings?: Record<string, unknown> | null;
  avatar_id?: number | null;
  company_name?: string | null;
  company_address?: string | null;
  logo_path?: string | null;
};

export async function fetchProfile(): Promise<UserProfile> {
  const res = await getJSON<{ profile: UserProfile }>(`/api/profile`);
  return res.profile;
}

export async function updateProfile(patch: Partial<Pick<UserProfile, 'name' | 'avatar_id'>>): Promise<UserProfile> {
  const res = await getJSON<{ profile: UserProfile }>(`/api/profile`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res.profile;
}

export async function uploadCompanyLogo(file: File): Promise<string> {
  const toDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });
  const dataUrl = await toDataUrl(file);
  const res = await getJSON<{ path: string }>(`/api/settings/company-logo`, {
    method: 'POST',
    body: JSON.stringify({ fileBase64: dataUrl }),
  });
  return res.path;
}

// Wallet & Crypto (mock) API helpers
export type Wallet = { id: string; currency: string; balance_cents: number; created_at: string };
export type WalletTransaction = {
  id: string;
  wallet_id: string;
  type: 'credit' | 'debit';
  amount_cents: number;
  reference?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};
export type PaymentIntent = {
  id: string;
  invoice_id?: string | null;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  provider: string;
  provider_ref?: string | null;
  created_at: string;
  confirmed_at?: string | null;
};

export async function listWallets(): Promise<Wallet[]> {
  const res = await getJSON<{ wallets: Wallet[] }>(`/api/wallets`);
  return res.wallets || [];
}

export async function listWalletTransactions(): Promise<WalletTransaction[]> {
  const res = await getJSON<{ transactions: WalletTransaction[] }>(`/api/wallets/transactions`);
  return res.transactions || [];
}

export async function listCryptoIntents(): Promise<PaymentIntent[]> {
  const res = await getJSON<{ intents: PaymentIntent[] }>(`/api/crypto/intents`);
  return res.intents || [];
}

export async function getCryptoIntent(id: string): Promise<PaymentIntent> {
  const res = await getJSON<{ intent: PaymentIntent }>(`/api/crypto/intents/${id}`);
  return res.intent;
}

export async function createCryptoIntent(amount_cents: number, invoice_id?: string): Promise<{ intent: PaymentIntent; checkout_url: string }> {
  return getJSON<{ intent: PaymentIntent; checkout_url: string }>(`/api/crypto/intents`, {
    method: 'POST',
    body: JSON.stringify({ amount_cents, invoice_id }),
  });
}

export async function confirmCryptoIntent(intent_id: string): Promise<{ ok: boolean; intent: PaymentIntent }> {
  return getJSON<{ ok: boolean; intent: PaymentIntent }>(`/api/crypto/mock/confirm`, {
    method: 'POST',
    body: JSON.stringify({ intent_id }),
  });
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const baseHeaders: HeadersInit = {
    ...(init.headers || {}),
  } as HeadersInit;

  // Attach Authorization header if we have a token
  const authHeaders: HeadersInit = ACCESS_TOKEN ? { Authorization: `Bearer ${ACCESS_TOKEN}` } : {};

  // Only set JSON content-type if we are sending a JSON body
  const shouldSetJson = !!init.body && !(init.body instanceof FormData) && !(init.body instanceof Blob);
  const headers: HeadersInit = shouldSetJson
    ? { 'Content-Type': 'application/json', ...authHeaders, ...baseHeaders }
    : { ...authHeaders, ...baseHeaders };

  return fetch(resolveUrl(input), { ...init, headers, credentials: 'include' });
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

// Settings API helpers
export type UserSettings = {
  companyName?: string;
  companyAddress?: string;
  companyLogoPath?: string;
  currency?: string;
  defaultTaxRate?: number;
  notifications?: {
    invoicePaid?: boolean;
    paymentReminder?: boolean;
    productUpdates?: boolean;
  };
  apiKey?: string | null;
};

export async function fetchUserSettings(): Promise<UserSettings> {
  try {
    const res = await getJSON<{ settings: UserSettings }>(`/api/settings`);
    return res.settings || {};
  } catch {
    // Fallback to localStorage if server not available
    try {
      return JSON.parse(localStorage.getItem('ledgr:settings') || '{}');
    } catch {
      return {} as UserSettings;
    }
  }
}

export async function saveUserSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  // Optimistically merge with local
  let merged: UserSettings = {};
  try {
    const current = await fetchUserSettings();
    merged = { ...current, ...patch };
  } catch {
    merged = { ...patch } as UserSettings;
  }
  // Persist to server (best-effort)
  try {
    const res = await getJSON<{ settings: UserSettings }>(`/api/settings`, {
      method: 'PUT',
      body: JSON.stringify({ settings: merged }),
    });
    merged = res.settings || merged;
  } catch {
    // ignore server errors here
  }
  // Always mirror to localStorage as fallback
  try {
    localStorage.setItem('ledgr:settings', JSON.stringify(merged));
  } catch {}
  return merged;
}
