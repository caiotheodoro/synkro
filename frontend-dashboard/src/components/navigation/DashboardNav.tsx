"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { authService } from "@/services/auth.service";
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  BoxIcon,
  ShoppingCart,
  Activity,
  Gauge,
  TrendingUp,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  subItems?: NavItem[];
}

const DashboardNav = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const mainNavItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Backoffice",
      href: "/backoffice",
      icon: <Truck className="w-5 h-5" />,
    },
    {
      label: "Analytics",
      href: "/analytics/overview",
      icon: <BarChart3 className="w-5 h-5" />,
      subItems: [
        {
          label: "Inventory",
          href: "/analytics/inventory",
          icon: <Package className="w-5 h-5" />,
        },
        {
          label: "Orders",
          href: "/analytics/orders",
          icon: <ShoppingCart className="w-5 h-5" />,
        },
        {
          label: "Transactions",
          href: "/analytics/transactions",
          icon: <Activity className="w-5 h-5" />,
        },
        {
          label: "Performance",
          href: "/analytics/performance",
          icon: <Gauge className="w-5 h-5" />,
        },
        {
          label: "Business",
          href: "/analytics/business",
          icon: <TrendingUp className="w-5 h-5" />,
        },
      ],
    },
  ];

  const secondaryNavItems: NavItem[] = [
    {
      label: "Logout",
      href: "/logout",
      icon: <LogOut className="w-5 h-5" />,
    },
  ];

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    authService.logout();
  };

  const isActive = (href: string) => {
    if (href === "/") {
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
                      ? "bg-primary text-white shadow-neo border-[2px] border-black"
                      : "text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
                {item.subItems && isActive(item.href) && (
                  <ul className="mt-1 ml-8 space-y-1">
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          href={subItem.href}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive(subItem.href)
                              ? "bg-primary text-white shadow-neo border-[2px] border-black"
                              : "text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          {subItem.icon}
                          <span className="ml-3">{subItem.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
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
                  onClick={item.href === "/logout" ? handleLogout : undefined}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? "bg-primary text-white shadow-neo border-[2px] border-black"
                      : "text-gray-900 hover:bg-gray-100"
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
