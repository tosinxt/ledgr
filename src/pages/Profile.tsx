import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AvatarPicker } from '@/components/ui/avatar-picker';
import { fetchProfile, updateProfile } from '@/lib/api';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [avatarId, setAvatarId] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await fetchProfile();
        if (!mounted) return;
        if (typeof profile.avatar_id === 'number') setAvatarId(profile.avatar_id || undefined);
      } catch {
        /* noop: ignore fetch errors */
      }
    })();
    return () => { mounted = false; };
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
        <p className="text-sm text-gray-500">Manage your personal information</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Avatar</h3>
        <div className="space-y-4">
          <AvatarPicker
            selectedId={avatarId}
            onChange={async (id) => {
              setAvatarId(id);
              try {
                setSaving(true);
                await updateProfile({ avatar_id: id });
                // notify app that profile changed
                try {
                  window.dispatchEvent(new CustomEvent('profile:updated', { detail: { avatar_id: id } }));
                } catch {}
              } finally {
                setSaving(false);
              }
            }}
            username={user?.name || user?.email || 'Me'}
          />
          {saving && (
            <p className="text-sm text-gray-500">Saving…</p>
          )}
        </div>
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
