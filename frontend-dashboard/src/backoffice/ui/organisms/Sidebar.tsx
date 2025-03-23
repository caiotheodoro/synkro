import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "@/backoffice/core/types";

interface SidebarProps {
  navItems: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems }) => {
  const location = useLocation();

  return (
    <div className="w-64 bg-slate-900 text-white h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold">Synkro</h1>
        <p className="text-sm text-slate-400">Inventory Management</p>
      </div>

      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon as LucideIcon;
            const isActive = location.pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors",
                    "hover:bg-slate-800 focus:bg-slate-800 focus:outline-none",
                    isActive && "bg-slate-800 text-white"
                  )}
                  aria-label={item.label}
                  tabIndex={0}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-sm font-medium">U</span>
          </div>
          <div>
            <p className="text-sm font-medium">User Name</p>
            <p className="text-xs text-slate-400">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};
