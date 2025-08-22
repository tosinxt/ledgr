import React from "react";
import { LayoutDashboard, UserCog, Settings, LogOut, Receipt, FileText } from "lucide-react";

export type NavLinkItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[]; // optional role gating
};

export function getDashboardLinks(user?: { role?: string | null }) : NavLinkItem[] {
  const role = user?.role ?? "user";

  const base: NavLinkItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Invoices",
      href: "/dashboard/invoices",
      icon: (
        <Receipt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Templates",
      href: "/dashboard/templates",
      icon: (
        <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
      icon: (
        <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const adminOnly: NavLinkItem[] = [
    {
      label: "Logout",
      href: "/logout",
      icon: (
        <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      roles: ["admin", "user"],
    },
  ];

  const allowed = (item: NavLinkItem) => !item.roles || item.roles.includes(role);

  return [...base, ...adminOnly].filter(allowed);
}
