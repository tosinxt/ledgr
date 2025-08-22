import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { getDashboardLinks } from '@/config/nav';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const navLinks = getDashboardLinks();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* App Logo / Title */}
            <div className="px-2 py-1 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              {open ? 'Ledgr' : 'L'}
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
                  <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    {(user?.name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      {/* Main dashboard content (renders nested routes) */}
      <div className="flex-1 p-2 md:p-6 bg-white dark:bg-neutral-900 h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;