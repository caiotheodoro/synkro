import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { authService } from '@/services/auth.service';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

export default function InventoryPage() {
  const router = useRouter();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log(authService.isAuthenticated(),authService.getToken(),authService.getUser());
  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Simulate fetching inventory data
    const fetchInventory = () => {
      // Mock data
      const mockInventory: InventoryItem[] = [
        {
          id: '1',
          name: 'Wireless Headphones',
          sku: 'WH-1001',
          category: 'Electronics',
          quantity: 45,
          status: 'In Stock',
          lastUpdated: '2023-10-15',
        },
        {
          id: '2',
          name: 'Smart Watch',
          sku: 'SW-2002',
          category: 'Electronics',
          quantity: 12,
          status: 'Low Stock',
          lastUpdated: '2023-10-18',
        },
        {
          id: '3',
          name: 'Bluetooth Speaker',
          sku: 'BS-3003',
          category: 'Electronics',
          quantity: 0,
          status: 'Out of Stock',
          lastUpdated: '2023-10-10',
        },
        {
          id: '4',
          name: 'Laptop Stand',
          sku: 'LS-4004',
          category: 'Accessories',
          quantity: 78,
          status: 'In Stock',
          lastUpdated: '2023-10-20',
        },
        {
          id: '5',
          name: 'USB-C Cable',
          sku: 'UC-5005',
          category: 'Accessories',
          quantity: 8,
          status: 'Low Stock',
          lastUpdated: '2023-10-17',
        },
      ];

      setTimeout(() => {
        setInventoryItems(mockInventory);
        setIsLoading(false);
      }, 1000);
    };

    fetchInventory();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'text-green-500';
      case 'Low Stock':
        return 'text-amber-500';
      case 'Out of Stock':
        return 'text-destructive';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <>
      <Head>
        <title>Inventory Management - Synkro Dashboard</title>
        <meta name="description" content="Manage your inventory in real-time" />
      </Head>
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <button className="btn btn-primary">
              <Package className="w-4 h-4 mr-2" />
              Add New Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card-neo">
              <div className="p-6 flex items-center">
                <div className="rounded-full bg-green-100 p-3 mr-4">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-2xl font-bold">1,245</p>
                </div>
              </div>
            </div>

            <div className="card-neo">
              <div className="p-6 flex items-center">
                <div className="rounded-full bg-amber-100 p-3 mr-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Low Stock Alerts</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
              </div>
            </div>

            <div className="card-neo">
              <div className="p-6 flex items-center">
                <div className="rounded-full bg-blue-100 p-3 mr-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Restock Needed</p>
                  <p className="text-2xl font-bold">18</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-neo overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold">Inventory Items</h2>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{item.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{item.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {item.lastUpdated}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 