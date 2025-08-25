import React, { useEffect, useRef, useState } from 'react';
import { fetchUserSettings, saveUserSettings, type UserSettings, uploadCompanyLogo, fetchCompanyLogoUrl } from '@/lib/api';

const Settings: React.FC = () => {
  // Local persisted settings (mock persistence via localStorage)
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(10);
  const [notifications, setNotifications] = useState({
    invoicePaid: true,
    paymentReminder: true,
    productUpdates: false,
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Email settings UI removed for testing via backend only

  useEffect(() => {
    (async () => {
      try {
        const s: UserSettings = await fetchUserSettings();
        if (s.companyName) setCompanyName(s.companyName);
        if (s.companyAddress) setCompanyAddress(s.companyAddress);
        if (s.currency) setCurrency(s.currency);
        if (typeof s.defaultTaxRate === 'number') setDefaultTaxRate(s.defaultTaxRate);
        if (s.notifications) setNotifications(prev => ({ ...prev, ...s.notifications! }));
        // apiKey handling removed from UI for now
        try {
          const url = await fetchCompanyLogoUrl();
          setLogoUrl(url);
        } catch {
          /* noop: logo may not exist yet */
        }
      } catch (e) {
        console.warn('Failed to load settings; falling back to defaults', e);
      }
    })();
  }, []);

  const persist = async (patch: Partial<UserSettings>) => {
    setMessage(null);
    await saveUserSettings(patch);
  };

  // Email actions removed

  const saveCompanyProfile = async () => {
    await persist({ companyName, companyAddress });
  };

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    // Validate ~2MB max and image types
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file (PNG or JPG).' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image too large. Please keep under 2MB.' });
      return;
    }
    try {
      setUploading(true);
      await uploadCompanyLogo(file);
      const url = await fetchCompanyLogoUrl();
      setLogoUrl(url);
      setMessage({ type: 'success', text: 'Logo uploaded successfully.' });
    } finally {
      setUploading(false);
    }
  };

  const saveDefaults = async () => {
    await persist({ currency, defaultTaxRate });
  };

  const toggleNotif = async (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    await persist({ notifications: next });
  };

  // API key management removed from this screen

  const removeLogo = async () => {
    // We simply clear the stored path in settings; storage cleanup can be added later if needed
    await persist({ companyLogoPath: undefined });
    setLogoUrl(null);
    setMessage({ type: 'success', text: 'Logo removed.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-sm text-gray-500">Configure your company profile and app defaults</p>
      </div>

      {/* Email Settings UI removed */}

      {/* Inline messages */}
      {message && (
        <div className={`rounded-md p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Notifications */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</p>
        <div className="space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span className="text-neutral-700 dark:text-neutral-300">Email me when an invoice is paid</span>
            <input type="checkbox" className="h-4 w-4" checked={notifications.invoicePaid} onChange={() => toggleNotif('invoicePaid')} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="text-neutral-700 dark:text-neutral-300">Send payment reminders to clients</span>
            <input type="checkbox" className="h-4 w-4" checked={notifications.paymentReminder} onChange={() => toggleNotif('paymentReminder')} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="text-neutral-700 dark:text-neutral-300">Product updates</span>
            <input type="checkbox" className="h-4 w-4" checked={notifications.productUpdates} onChange={() => toggleNotif('productUpdates')} />
          </label>
        </div>
      </div>

      {/* Company Profile */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Company Profile</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
            <input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex justify-start pt-2 gap-2">
              <button onClick={saveCompanyProfile} className="inline-flex items-center rounded-md bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 px-3 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500">Save</button>
              {(companyName || companyAddress) && (
                <button onClick={async () => { setCompanyName(''); setCompanyAddress(''); await saveUserSettings({ companyName: '', companyAddress: '' }); setMessage({ type: 'success', text: 'Company profile cleared.' }); }} className="inline-flex items-center rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800">Clear</button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company logo</label>
            <div
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-6 text-center cursor-pointer bg-neutral-50 dark:bg-neutral-800/40 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
              role="button"
              aria-label="Upload company logo"
            >
              <div className="w-28 h-28 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Company Logo" className="object-contain w-full h-full" />
                ) : (
                  <span className="text-xs text-neutral-500">No logo</span>
                )}
              </div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">
                <p><strong>Drop files here</strong> or click to upload</p>
                <p className="text-xs text-neutral-500 mt-1">PNG, JPG up to 2MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              {uploading && <p className="text-xs text-gray-500">Uploading…</p>}
              {logoUrl && !uploading && (
                <button onClick={removeLogo} className="text-xs text-red-600 hover:underline">Remove logo</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Defaults */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Defaults</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="NGN">NGN</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Tax Rate (%)</label>
            <input type="number" min={0} max={100} step={0.1} value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={saveDefaults} className="inline-flex items-center rounded-md bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 px-3 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500">Save</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
