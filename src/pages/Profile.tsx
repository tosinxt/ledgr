import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const Profile: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
        <p className="text-sm text-gray-500">Manage your personal information</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={user?.name ?? ''}
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={user?.email ?? ''}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
