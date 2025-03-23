import {
  Package,
  ShoppingCart,
  Users as User,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { ApiService } from "@/services/api.service";
import { BackofficeBuilder } from "../molecules/BackofficeBuilder";
import { BackofficeBuilderImpl } from "./BackofficeBuilderImpl";

export class BackofficeDirector {
  private readonly apiService: ApiService;

  constructor(apiBaseUrl: string) {
    this.apiService = new ApiService({
      baseUrl: apiBaseUrl,
      timeout: 10000,
    });
  }

  // Create a new builder instance
  createBuilder(): BackofficeBuilder {
    return new BackofficeBuilderImpl(this.apiService);
  }

  // Build customer module
  buildCustomerModule(builder: BackofficeBuilder) {
    const moduleBuilder = this.createBuilder();

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
          { field: "name", header: "Name" },
          { field: "email", header: "Email" },
          { field: "phone", header: "Phone" },
          { field: "created_at", header: "Created At" },
        ],
        searchFields: ["name", "email", "phone"],
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
              return undefined;
            },
          },
          {
            name: "phone",
            label: "Phone",
            type: "text",
          },
        ],
      })
      .build();
  }

  // Build warehouse module
  buildWarehouseModule(builder: BackofficeBuilder) {
    const moduleBuilder = this.createBuilder();

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
        icon: WarehouseIcon,
      })
      .setListConfig({
        columns: [
          { field: "name", header: "Name" },
          { field: "code", header: "Code" },
          { field: "city", header: "City" },
          { field: "state", header: "State" },
          { field: "country", header: "Country" },
          { field: "active", header: "Active" },
        ],
        searchFields: ["name", "code", "city", "state", "country"],
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
            name: "code",
            label: "Code",
            type: "text",
            required: true,
          },
          {
            name: "address_line1",
            label: "Address Line 1",
            type: "text",
            required: true,
          },
          {
            name: "city",
            label: "City",
            type: "text",
            required: true,
          },
          {
            name: "state",
            label: "State",
            type: "text",
            required: true,
          },
          {
            name: "postal_code",
            label: "Postal Code",
            type: "text",
            required: true,
          },
          {
            name: "country",
            label: "Country",
            type: "text",
            required: true,
          },
          {
            name: "active",
            label: "Active",
            type: "boolean",
          },
        ],
      })
      .build();
  }

  // Build inventory module
  buildInventoryModule(builder: BackofficeBuilder) {
    const moduleBuilder = this.createBuilder();

    return moduleBuilder
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
          { field: "name", header: "Name" },
          { field: "sku", header: "SKU" },
          { field: "quantity", header: "Quantity" },
          { field: "reorder_point", header: "Reorder Point" },
          { field: "price", header: "Price" },
          { field: "active", header: "Active" },
        ],
        searchFields: ["name", "sku"],
      })
      .setFormConfig({
        fields: [
          {
            name: "name",
            label: "Product Name",
            type: "text",
            required: true,
          },
          {
            name: "sku",
            label: "SKU",
            type: "text",
            required: true,
          },
          {
            name: "description",
            label: "Description",
            type: "textarea",
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            required: true,
          },
          {
            name: "reorder_point",
            label: "Reorder Point",
            type: "number",
            required: true,
          },
          {
            name: "price",
            label: "Price",
            type: "number",
            required: true,
          },
          {
            name: "active",
            label: "Active",
            type: "boolean",
          },
        ],
        sections: [
          {
            title: "Basic Information",
            fields: ["name", "sku", "description"],
          },
          {
            title: "Inventory Details",
            fields: ["quantity", "reorder_point", "price", "active"],
          },
        ],
      })
      .build();
  }

  // Build orders module
  buildOrderModule(builder: BackofficeBuilder) {
    const moduleBuilder = this.createBuilder();

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
          { field: "customer_name", header: "Customer" },
          { field: "status", header: "Status" },
          { field: "total", header: "Total" },
          { field: "created_at", header: "Created At" },
        ],
        searchFields: ["id", "customer_name", "status"],
      })
      .setFormConfig({
        fields: [
          {
            name: "customer_id",
            label: "Customer",
            type: "select",
            required: true,
            options: [], // These would be fetched dynamically
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: [
              { value: "pending", label: "Pending" },
              { value: "processing", label: "Processing" },
              { value: "shipped", label: "Shipped" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ],
          },
          {
            name: "total",
            label: "Total",
            type: "number",
            required: true,
          },
          {
            name: "notes",
            label: "Notes",
            type: "textarea",
          },
        ],
      })
      .build();
  }

  // Build inventory transactions module
  buildInventoryTransactionsModule(builder: BackofficeBuilder) {
    const moduleBuilder = this.createBuilder();

    return moduleBuilder
      .setConfig({
        title: "Transactions",
        basePath: "/backoffice/transactions",
        permissions: ["view_inventory_transactions"],
      })
      .setApiEndpoint("/api/inventory/transactions")
      .setNavItem({
        label: "Transactions",
        href: "/backoffice/transactions",
        icon: Activity,
      })
      .setListConfig({
        columns: [
          { field: "id", header: "Transaction ID" },
          { field: "item_name", header: "Item" },
          { field: "quantity", header: "Quantity" },
          { field: "type", header: "Type" },
          { field: "reason", header: "Reason" },
          { field: "created_at", header: "Created At" },
        ],
        searchFields: ["id", "item_name", "reason"],
      })
      .setFormConfig({
        fields: [
          {
            name: "item_id",
            label: "Item",
            type: "select",
            required: true,
            options: [], // These would be fetched dynamically
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            required: true,
          },
          {
            name: "type",
            label: "Type",
            type: "select",
            required: true,
            options: [
              { value: "in", label: "Stock In" },
              { value: "out", label: "Stock Out" },
            ],
          },
          {
            name: "reason",
            label: "Reason",
            type: "text",
            required: true,
          },
        ],
      })
      .build();
  }

  // Build inventory reservations module
  buildInventoryReservationsModule(builder: BackofficeBuilder) {
    const moduleBuilder = this.createBuilder();

    return moduleBuilder
      .setConfig({
        title: "Reservations",
        basePath: "/backoffice/reservations",
        permissions: ["view_inventory_reservations"],
      })
      .setApiEndpoint("/api/inventory/reservations")
      .setNavItem({
        label: "Reservations",
        href: "/backoffice/reservations",
        icon: AlertTriangle,
      })
      .setListConfig({
        columns: [
          { field: "id", header: "Reservation ID" },
          { field: "item_name", header: "Item" },
          { field: "quantity", header: "Quantity" },
          { field: "status", header: "Status" },
          { field: "order_id", header: "Order ID" },
          { field: "expires_at", header: "Expires At" },
        ],
        searchFields: ["id", "item_name", "order_id"],
      })
      .setFormConfig({
        fields: [
          {
            name: "item_id",
            label: "Item",
            type: "select",
            required: true,
            options: [], // These would be fetched dynamically
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            required: true,
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: [
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "cancelled", label: "Cancelled" },
            ],
          },
          {
            name: "order_id",
            label: "Order ID",
            type: "text",
          },
          {
            name: "expires_at",
            label: "Expires At",
            type: "date",
            required: true,
          },
        ],
      })
      .build();
  }
}
