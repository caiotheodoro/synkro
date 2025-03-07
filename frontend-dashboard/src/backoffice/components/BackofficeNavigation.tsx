import React, { createElement } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useBackofficeRegistry } from '../core/BackofficeRegistry';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  Settings,
  CreditCard,
  LogOut
} from 'lucide-react';
import { authService } from '@/services/auth.service';


interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}


const getModuleIcon = (moduleName: string) => {
  switch (moduleName.toLowerCase()) {
    case 'inventory':
      return <Package className="w-5 h-5" />;
    case 'orders':
      return <ShoppingCart className="w-5 h-5" />;
    case 'customers':
      return <Users className="w-5 h-5" />;
    case 'shipping':
      return <Truck className="w-5 h-5" />;
    case 'payments':
      return <CreditCard className="w-5 h-5" />;
    case 'settings':
      return <Settings className="w-5 h-5" />;
    default:
      return <LayoutDashboard className="w-5 h-5" />;
  }
};

export const BackofficeNavigation: React.FC = () => {
  const router = useRouter();
  const { modules } = useBackofficeRegistry();


  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    authService.logout();
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === href;
    }
    return href.includes(router.query.moduleId as string);
  };

  const navItems: NavItem[] = Object.values(modules).map((item) => ({
    label: item.config?.title || item.navItem?.label || 'Unknown',
    href: item.navItem?.href || item.config?.basePath || '#',
    icon: item.navItem?.icon || getModuleIcon(item.config?.title || '')
  }));

  const accountItems: NavItem[] = [
  
    {
      label: 'Logout',
      href: '/logout',
      icon: <LogOut className="w-5 h-5" />
    }
  ];
  console.log(router.query.moduleId);

  return (
    <nav className="h-full overflow-y-auto py-6 px-4">
      <div className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </h3>
          <ul className="space-y-1">
            {navItems.map((item, index) => (
              <li key={item.href || index}>
                <Link
                  href={item.href || '#'}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-white shadow-neo border-[2px] border-black'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {createElement(item.icon as React.ElementType)}
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
            {accountItems.map((item) => (
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