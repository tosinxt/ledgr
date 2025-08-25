import React, { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { getDashboardLinks } from '@/config/nav';
import { Input } from '@/components/ui/input';
import { ThemeToggleCompact } from '@/components/ui/theme-toggle';
import { Plus, Search } from 'lucide-react';
import contourMapSvg from '@/assets/contour_map(2).svg';
import { fetchProfile } from '@/lib/api';
import { AvatarIcon } from '@/components/ui/avatar-picker';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [avatarId, setAvatarId] = useState<number | undefined>(undefined);

  const [open, setOpen] = useState(false);
  const navLinks = getDashboardLinks();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await fetchProfile();
        if (!mounted) return;
        setAvatarId(typeof profile.avatar_id === 'number' ? profile.avatar_id : undefined);
      } catch {
        // ignore errors
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Update avatar immediately when profile is changed elsewhere (e.g., Profile page)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { avatar_id?: number } | undefined;
      if (detail && typeof detail.avatar_id === 'number') {
        setAvatarId(detail.avatar_id);
      }
    };
    window.addEventListener('profile:updated', handler as EventListener);
    return () => window.removeEventListener('profile:updated', handler as EventListener);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* App Logo / Title */}
            <div className="px-2 py-1 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              {open ? 'ledgr.io' : 'L'}
            </div>
            <div className="mt-4 flex flex-col gap-1">
              {navLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div className="px-2 pb-2">
            <SidebarLink
              link={{
                label: user?.name || 'Account',
                href: '/dashboard/profile',
                icon: (
                  <AvatarIcon id={avatarId} />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      {/* Main dashboard content (renders nested routes) */}
      <div className="flex-1 relative h-screen overflow-y-auto">
        {/* Background with contour map */}
        <div 
          className="absolute inset-0 bg-white dark:bg-neutral-900"
          style={{
            backgroundImage: `url("${contourMapSvg}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.03
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* Top bar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">ledgr.io</h1>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search invoices, customers..."
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <ThemeToggleCompact />
              <Link to="/dashboard/profile" className="inline-flex items-center justify-center">
                <AvatarIcon id={avatarId} />
              </Link>
              <Link
                to="/dashboard/create-invoice"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="h-4 w-4" /> New Invoice
              </Link>
            </div>
          </div>

          {/* Routed content */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;