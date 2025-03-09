import React, { useState } from "react";
import { Package, AlertTriangle, TrendingUp, Plus } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastUpdated: string;
}

interface InventoryDashboardProps {
  inventoryItems: InventoryItem[];
  isLoading?: boolean;
  onAddItem?: () => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  inventoryItems,
  isLoading = false,
  onAddItem,
}) => {
  const totalItems = 1245;
  const lowStockAlerts = 24;
  const restockNeeded = 18;

  const getStatusClass = (status: string) => {
    switch (status) {
      case "In Stock":
        return "text-green-500";
      case "Low Stock":
        return "text-amber-500";
      case "Out of Stock":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <button
          onClick={onAddItem}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add New Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Items Card */}
        <div className="bg-white border-3 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-6 flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold">
                {totalItems.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="bg-white border-3 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-6 flex items-center">
            <div className="rounded-full bg-amber-100 p-3 mr-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock Alerts</p>
              <p className="text-2xl font-bold">{lowStockAlerts}</p>
            </div>
          </div>
        </div>

        {/* Restock Needed Card */}
        <div className="bg-white border-3 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-6 flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Restock Needed</p>
              <p className="text-2xl font-bold">{restockNeeded}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border-3 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
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
              <thead className="bg-gray-50 border-b-3 border-black">
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
                      <span className={`${getStatusClass(item.status)}`}>
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
  );
};
