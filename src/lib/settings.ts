export type AppSettings = {
  companyName?: string;
  companyAddress?: string;
  currency?: string;
  defaultTaxRate?: number;
  notifications?: {
    invoicePaid?: boolean;
    paymentReminder?: boolean;
    productUpdates?: boolean;
  };
  apiKey?: string | null;
};

const STORAGE_KEY = 'ledgr:settings';

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AppSettings;
  } catch {
    return {};
  }
}

export function setSettings(patch: Partial<AppSettings>) {
  const current = getSettings();
  const next = { ...current, ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
