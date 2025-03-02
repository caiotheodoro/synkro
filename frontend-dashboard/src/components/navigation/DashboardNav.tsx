'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { authService } from '@/services/auth.service';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  BarChart3,
  Settings,
  Bell,
  LogOut,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const DashboardNav = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const mainNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Inventory',
      href: '/inventory',
      icon: <Package className="w-5 h-5" />,
    },
    {
      label: 'Orders',
      href: '/orders',
      icon: <Truck className="w-5 h-5" />,
    },
    {
      label: 'Suppliers',
      href: '/suppliers',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  const secondaryNavItems: NavItem[] = [
    {
      label: 'Notifications',
      href: '/notifications',
      icon: <Bell className="w-5 h-5" />,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      label: 'Logout',
      href: '/logout',
      icon: <LogOut className="w-5 h-5" />,
    },
  ];

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    authService.logout();
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  return (
    <nav className="h-full overflow-y-auto py-6 px-4">
      <div className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </h3>
          <ul className="space-y-1">
            {mainNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-white shadow-neo border-[2px] border-black'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Account
          </h3>
          <ul className="space-y-1">
            {secondaryNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={item.href === '/logout' ? handleLogout : undefined}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-white shadow-neo border-[2px] border-black'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav; 