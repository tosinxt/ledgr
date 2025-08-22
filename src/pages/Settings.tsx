import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-sm text-gray-500">Configure your application preferences</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark mode</p>
            <p className="text-xs text-gray-500">Use your system theme</p>
          </div>
          <input type="checkbox" className="h-4 w-4" disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
          <select className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Settings;
