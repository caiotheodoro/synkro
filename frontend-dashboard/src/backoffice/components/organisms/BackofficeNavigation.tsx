import React, { createElement } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Settings,
  CreditCard,
  LogOut,
  ArrowLeft,
  Activity,
} from "lucide-react";
import { auth } from "@/services/auth-instance.service";
import { useBackofficeRegistry } from "@/backoffice/core/builders/BackofficeRegistry";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const getModuleIcon = (moduleName: string) => {
  switch (moduleName.toLowerCase()) {
    case "inventory":
      return <Package className="w-5 h-5" />;
    case "orders":
      return <ShoppingCart className="w-5 h-5" />;
    case "customers":
      return <Users className="w-5 h-5" />;
    case "shipping":
      return <Truck className="w-5 h-5" />;
    case "payments":
      return <CreditCard className="w-5 h-5" />;
    case "settings":
      return <Settings className="w-5 h-5" />;
    default:
      return <LayoutDashboard className="w-5 h-5" />;
  }
};

export const BackofficeNavigation: React.FC = () => {
  const router = useRouter();
  const { modules } = useBackofficeRegistry();
  const isAnalyticsPath = router.pathname.startsWith("/analytics");
  const isBackofficePath = router.pathname.startsWith("/backoffice");

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    auth.logout();
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return router.pathname === href;
    }
    return (
      router.pathname.startsWith(href) ||
      href.includes(router.query.moduleId as string)
    );
  };

  const navItems: NavItem[] = Object.values(modules).map((item) => ({
    label: item.config?.title || item.navItem?.label || "Unknown",
    href: item.navItem?.href || item.config?.basePath || "#",
    icon: item.navItem?.icon || getModuleIcon(item.config?.title || ""),
  }));

  const analyticsItems: NavItem[] = [
    {
      label: "Analytics Overview",
      href: "/analytics/overview",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Inventory Analytics",
      href: "/analytics/inventory",
      icon: <Package className="w-5 h-5" />,
    },
    {
      label: "Order Analytics",
      href: "/analytics/orders",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      label: "Transaction Analytics",
      href: "/analytics/transactions",
      icon: <Activity className="w-5 h-5" />,
    },
  ];

  const accountItems: NavItem[] = [
    {
      label: "Logout",
      href: "/logout",
      icon: <LogOut className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="h-full overflow-y-auto p-2">
      <div className="space-y-8">
        <Link
          href="/"
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-900 hover:bg-gray-100 mb-4"
          tabIndex={0}
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="ml-3">Back to Dashboard</span>
        </Link>

        {isBackofficePath && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Main
            </h3>
            <ul className="space-y-1">
              {navItems.map((item, index) => (
                <li key={item.href || index}>
                  <Link
                    href={item.href || "#"}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? "bg-primary text-white shadow-neo border-[2px] border-black"
                        : "text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {createElement(item.icon as React.ElementType)}
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isAnalyticsPath && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Analytics
            </h3>
            <ul className="space-y-1">
              {analyticsItems.map((item) => (
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
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Account
          </h3>
          <ul className="space-y-1">
            {accountItems.map((item) => (
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
