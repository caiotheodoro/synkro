import React from "react";
import { BackofficeBuilder } from "./BackofficeBuilder";
import { BackofficeBuilderImpl } from "./BackofficeBuilderImpl";
import {
  Package,
  ShoppingCart,
  Users as User,
  Warehouse,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { StatsCard } from "../components/StatsCard";
import { ApiService } from "@/services/api.service";

export class BackofficeDirector {
  private readonly apiService: ApiService;

  constructor(apiBaseUrl: string) {
    this.apiService = new ApiService({
      baseUrl: apiBaseUrl,
      timeout: 10000,
    });
  }

  createBuilder(): BackofficeBuilder {
    return new BackofficeBuilderImpl(this.apiService);
  }

  buildCustomerModule(builder: BackofficeBuilder) {
    const moduleBuilder = new BackofficeBuilderImpl(this.apiService);

    return moduleBuilder
      .setConfig({
        title: "Customers",
        basePath: "/backoffice/customers",
        permissions: ["view_customers", "edit_customers"],
      })
      .setApiEndpoint("/api/customers")
      .setNavItem({
        label: "Customers",
        href: "/backoffice/customers",
        icon: User,
      })
      .setListConfig({
        columns: [
          { field: "id", header: "ID" },
          { field: "name", header: "Name" },
          { field: "email", header: "Email" },
          { field: "phone", header: "Phone" },
          { field: "createdAt", header: "Created At" },
        ],
        searchFields: ["name", "email", "phone"],
        actions: [
          {
            label: "Edit",
            action: (item) => console.log("Edit", item),
            permission: "edit_customers",
          },
          {
            label: "Delete",
            action: (item) => console.log("Delete", item),
            permission: "edit_customers",
          },
        ],
      })
      .setFormConfig({
        fields: [
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
          },
          {
            name: "email",
            label: "Email",
            type: "text",
            required: true,
            validation: (value) => {
              if (!/\S+@\S+\.\S+/.test(value)) {
                return "Invalid email address";
              }
            },
          },
          {
            name: "phone",
            label: "Phone",
            type: "text",
          },
          {
            name: "address",
            label: "Address",
            type: "textarea",
          },
          {
            name: "notes",
            label: "Notes",
            type: "textarea",
          },
        ],
      })
      .setDetailConfig({
        sections: [
          {
            title: "Customer Information",
            fields: [
              { label: "ID", field: "id" },
              { label: "Name", field: "name" },
              { label: "Email", field: "email" },
              { label: "Phone", field: "phone" },
              { label: "Address", field: "address" },
              { label: "Created At", field: "createdAt" },
            ],
          },
          {
            title: "Customer Notes",
            fields: [{ label: "Notes", field: "notes" }],
          },
        ],
        relatedEntities: [
          {
            title: "Orders",
            entity: "orders",
            relationField: "customerId",
            display: (item) =>
              `${item.id} - ${new Date(item.createdAt).toLocaleDateString()}`,
          },
        ],
      })
      .build();
  }

  buildWarehouseModule(builder: BackofficeBuilder) {
    // Start with a fresh builder each time to avoid endpoint conflicts
    const moduleBuilder = new BackofficeBuilderImpl(this.apiService);

    return moduleBuilder
      .setConfig({
        title: "Warehouses",
        basePath: "/backoffice/warehouses",
        permissions: ["view_warehouses", "edit_warehouses"],
      })
      .setApiEndpoint("/api/warehouses")
      .setNavItem({
        label: "Warehouses",
        href: "/backoffice/warehouses",
        icon: Warehouse,
      })
      .setListConfig({
        columns: [
          { field: "id", header: "ID" },
          { field: "name", header: "Name" },
          { field: "location", header: "Location" },
          { field: "capacity", header: "Capacity" },
          { field: "status", header: "Status" },
        ],
        searchFields: ["name", "location"],
        filters: [
          {
            field: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "maintenance", label: "Maintenance" },
            ],
          },
        ],
      })
      .setFormConfig({
        fields: [
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
          },
          {
            name: "location",
            label: "Location",
            type: "text",
            required: true,
          },
          {
            name: "capacity",
            label: "Capacity",
            type: "number",
            required: true,
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "maintenance", label: "Maintenance" },
            ],
            required: true,
          },
          {
            name: "description",
            label: "Description",
            type: "textarea",
          },
        ],
      })
      .setDetailConfig({
        sections: [
          {
            title: "Warehouse Information",
            fields: [
              { label: "ID", field: "id" },
              { label: "Name", field: "name" },
              { label: "Location", field: "location" },
              { label: "Capacity", field: "capacity" },
              { label: "Status", field: "status" },
              { label: "Description", field: "description" },
            ],
          },
        ],
        relatedEntities: [
          {
            title: "Inventory",
            entity: "inventory",
            relationField: "warehouseId",
            display: (item) => `${item.product.name} - ${item.quantity} units`,
          },
        ],
      })
      .build();
  }

  buildInventoryModule(builder: BackofficeBuilder) {
    // Start with a fresh builder each time to avoid endpoint conflicts
    const moduleBuilder = new BackofficeBuilderImpl(this.apiService);

    const module = moduleBuilder
      .setConfig({
        title: "Inventory",
        basePath: "/backoffice/inventory",
        permissions: ["view_inventory", "edit_inventory"],
      })
      .setApiEndpoint("/api/inventory")
      .setNavItem({
        label: "Inventory",
        href: "/backoffice/inventory",
        icon: Package,
      })
      .setListConfig({
        columns: [
          { field: "id", header: "ID" },
          { field: "product.name", header: "Product" },
          { field: "warehouse.name", header: "Warehouse" },
          { field: "quantity", header: "Quantity" },
          { field: "minQuantity", header: "Min Quantity" },
          { field: "lastUpdated", header: "Last Updated" },
          {
            field: "status",
            header: "Status",
            render: (value: string) => {
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
        ],
        searchFields: ["product.name", "warehouse.name"],
        filters: [
          {
            field: "warehouse.id",
            label: "Warehouse",
            type: "select",
            options: [], // To be populated dynamically
          },
        ],
      })
      .setFormConfig({
        fields: [
          {
            name: "productId",
            label: "Product",
            type: "select",
            options: [], // To be populated dynamically
            required: true,
          },
          {
            name: "warehouseId",
            label: "Warehouse",
            type: "select",
            options: [], // To be populated dynamically
            required: true,
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            required: true,
          },
          {
            name: "minQuantity",
            label: "Min Quantity",
            type: "number",
            required: true,
          },
          {
            name: "location",
            label: "Location in Warehouse",
            type: "text",
          },
        ],
      })
      .setDetailConfig({
        sections: [
          {
            title: "General Information",
            fields: [
              { field: "id", label: "ID" },
              { field: "product.name", label: "Product" },
              { field: "warehouse.name", label: "Warehouse" },
              { field: "quantity", label: "Quantity" },
              { field: "minQuantity", label: "Min Quantity" },
              { field: "location", label: "Location" },
              { field: "lastUpdated", label: "Last Updated" },
            ],
          },
        ],
      })
      .build();

    // Add custom renderStats method for inventory module
    module.renderStats = (data: any[]) => {
      return (
        <>
          <StatsCard
            title="Total Items"
            value={data.length}
            icon={<Package className="w-6 h-6" />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />

          <StatsCard
            title="Low Stock Alerts"
            value={
              data.filter(
                (item) =>
                  item.status === "Low Stock" ||
                  (item.quantity < item.minQuantity && item.quantity > 0)
              ).length
            }
            icon={<AlertTriangle className="w-6 h-6" />}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />

          <StatsCard
            title="Out of Stock"
            value={
              data.filter(
                (item) => item.status === "Out of Stock" || item.quantity === 0
              ).length
            }
            icon={<TrendingUp className="w-6 h-6" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
        </>
      );
    };

    return module;
  }

  buildOrderModule(builder: BackofficeBuilder) {
    // Start with a fresh builder each time to avoid endpoint conflicts
    const moduleBuilder = new BackofficeBuilderImpl(this.apiService);

    return moduleBuilder
      .setConfig({
        title: "Orders",
        basePath: "/backoffice/orders",
        permissions: ["view_orders", "edit_orders"],
      })
      .setApiEndpoint("/api/orders")
      .setNavItem({
        label: "Orders",
        href: "/backoffice/orders",
        icon: ShoppingCart,
      })
      .setListConfig({
        columns: [
          { field: "id", header: "Order ID" },
          { field: "customer.name", header: "Customer" },
          { field: "status", header: "Status" },
          { field: "totalAmount", header: "Total Amount" },
          { field: "createdAt", header: "Created At" },
        ],
        searchFields: ["id", "customer.name", "status"],
        filters: [
          {
            field: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "pending", label: "Pending" },
              { value: "processing", label: "Processing" },
              { value: "shipped", label: "Shipped" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ],
          },
        ],
      })
      .setFormConfig({
        fields: [
          {
            name: "customerId",
            label: "Customer",
            type: "select",
            options: [], // To be populated dynamically
            required: true,
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "pending", label: "Pending" },
              { value: "processing", label: "Processing" },
              { value: "shipped", label: "Shipped" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ],
            required: true,
          },
          {
            name: "shippingAddress",
            label: "Shipping Address",
            type: "textarea",
            required: true,
          },
          {
            name: "billingAddress",
            label: "Billing Address",
            type: "textarea",
            required: true,
          },
          {
            name: "notes",
            label: "Notes",
            type: "textarea",
          },
        ],
      })
      .setDetailConfig({
        sections: [
          {
            title: "Order Information",
            fields: [
              { label: "Order ID", field: "id" },
              { label: "Customer", field: "customer.name" },
              { label: "Status", field: "status" },
              { label: "Total Amount", field: "totalAmount" },
              { label: "Created At", field: "createdAt" },
            ],
          },
          {
            title: "Shipping Details",
            fields: [
              { label: "Shipping Address", field: "shippingAddress" },
              { label: "Billing Address", field: "billingAddress" },
              { label: "Notes", field: "notes" },
            ],
          },
        ],
        relatedEntities: [
          {
            title: "Order Items",
            entity: "orderItems",
            relationField: "orderId",
            display: (item) =>
              `${item.product.name} - ${item.quantity} units - $${item.price}`,
          },
        ],
      })
      .build();
  }
}
