import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { BackofficeLayout } from "../layouts/BackofficeLayout";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { StatsCard } from "../components";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DataTable, Column, TableAction } from "@/components/ui/DataTable";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastUpdated: string;
}

export const InventoryPage: React.FC = () => {
  //:const router = useRouter();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching inventory data
    const fetchInventory = () => {
      // Mock data
      const mockInventory: InventoryItem[] = [
        {
          id: "1",
          name: "Wireless Headphones",
          sku: "WH-1001",
          category: "Electronics",
          quantity: 45,
          status: "In Stock",
          lastUpdated: "2023-10-15",
        },
        {
          id: "2",
          name: "Smart Watch",
          sku: "SW-2002",
          category: "Electronics",
          quantity: 12,
          status: "Low Stock",
          lastUpdated: "2023-10-18",
        },
        {
          id: "3",
          name: "Bluetooth Speaker",
          sku: "BS-3003",
          category: "Electronics",
          quantity: 0,
          status: "Out of Stock",
          lastUpdated: "2023-10-10",
        },
        {
          id: "4",
          name: "Laptop Stand",
          sku: "LS-4004",
          category: "Accessories",
          quantity: 78,
          status: "In Stock",
          lastUpdated: "2023-10-20",
        },
        {
          id: "5",
          name: "USB-C Cable",
          sku: "UC-5005",
          category: "Accessories",
          quantity: 8,
          status: "Low Stock",
          lastUpdated: "2023-10-17",
        },
      ];

      setTimeout(() => {
        setInventoryItems(mockInventory);
        setIsLoading(false);
      }, 1000);
    };

    fetchInventory();
  }, []);

  const handleAddItem = () => {
    console.log("Add new item");
    //: router.push('/backoffice/inventory/create');
  };

  const handleEditItem = (item: InventoryItem) => {
    console.log("Edit item", item);
    //: router.push(`/backoffice/inventory/edit/${item.id}`);
  };

  const handleViewItem = (item: InventoryItem) => {
    console.log("View item", item);
    //: router.push(`/backoffice/inventory/${item.id}`);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    console.log("Delete item", item);
    // Implement delete confirmation
  };

  const columns: Column<InventoryItem>[] = [
    {
      field: "name",
      header: "Name",
    },
    {
      field: "sku",
      header: "SKU",
    },
    {
      field: "category",
      header: "Category",
    },
    {
      field: "quantity",
      header: "Quantity",
    },
    {
      field: "status",
      header: "Status",
      render: (value) => {
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

        return <span className={getStatusClass(value)}>{value}</span>;
      },
    },
    {
      field: "lastUpdated",
      header: "Last Updated",
    },
  ];

  const actions: TableAction<InventoryItem>[] = [
    {
      label: "View",
      icon: <Eye className="w-4 h-4" />,
      onClick: handleViewItem,
      variant: "outline",
    },
    {
      label: "Edit",
      icon: <Pencil className="w-4 h-4" />,
      onClick: handleEditItem,
      variant: "secondary",
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDeleteItem,
      variant: "danger",
    },
  ];

  return (
    <BackofficeLayout>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <Button variant="primary" onClick={handleAddItem}>
            <Plus className="w-5 h-5 mr-2" /> Add New Item
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Items"
            value={1245}
            icon={<Package className="w-6 h-6" />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />

          <StatsCard
            title="Low Stock Alerts"
            value={24}
            icon={<AlertTriangle className="w-6 h-6" />}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />

          <StatsCard
            title="Restock Needed"
            value={18}
            icon={<TrendingUp className="w-6 h-6" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={inventoryItems}
              columns={columns}
              actions={actions}
              isLoading={isLoading}
              emptyMessage="No inventory items found"
            />
          </CardContent>
        </Card>
      </div>
    </BackofficeLayout>
  );
};
