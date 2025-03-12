import React, { useState, useEffect } from "react";
import { BackofficeBuilder } from "./BackofficeBuilder";
import { BackofficeBuilderImpl } from "./BackofficeBuilderImpl";
import {
  Package,
  ShoppingCart,
  Users as User,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  TrendingUp,
  Tag,
  List,
} from "lucide-react";
import { StatsCard } from "../components/StatsCard";
import { ApiService } from "@/services/api.service";
import { AutocompleteSelect } from "@/components/ui/AutocompleteSelect";
import {
  MultiSelectAutocomplete,
  Option as MultiSelectOption,
} from "@/components/ui/MultiSelectAutocomplete";
import { OrderSummary } from "@/components/ui/OrderSummary";
import AttributesEditor from "@/components/molecules/AttributesEditor";
import {
  AttributesDisplay,
  AttributesBadges,
} from "@/components/atoms/AttributesDisplay";

interface ApiResponse<T> {
  data: T[];
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string | number;
}

interface Customer {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface OrderItem {
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
}

interface ProductCategory {
  id: string;
  name: string;
}

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
          { field: "name", header: "Name" },
          { field: "email", header: "Email" },
          { field: "phone", header: "Phone" },
          { field: "created_at", header: "Created At" },
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
        ],
      })
      .setDetailConfig({
        sections: [
          {
            title: "Customer Information",
            fields: [
              { label: "Name", field: "name" },
              { label: "Email", field: "email" },
              { label: "Phone", field: "phone" },
              { label: "Created At", field: "created_at" },
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
            relationField: "customer_id",
            display: (item) =>
              `${item.id} - ${new Date(item.created_at)
                .toISOString()
                .slice(0, 10)
                .replace(/-/g, "/")} 00:00`,
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
        icon: WarehouseIcon,
      })
      .setListConfig({
        columns: [
          { field: "name", header: "Name" },
          { field: "code", header: "Code" },
          { field: "address_line1", header: "Address Line 1" },
          { field: "address_line2", header: "Address Line 2" },
          { field: "city", header: "City" },
          { field: "state", header: "State" },
          { field: "postal_code", header: "Postal Code" },
          { field: "country", header: "Country" },
          { field: "contact_name", header: "Contact Name" },
          { field: "contact_email", header: "Contact Email" },
          { field: "contact_phone", header: "Contact Phone" },
          { field: "active", header: "Active" },
        ],
        searchFields: [
          "name",
          "code",
          "address_line1",
          "city",
          "state",
          "postal_code",
          "country",
          "contact_name",
          "contact_email",
          "contact_phone",
        ],
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
          {
            field: "active",
            label: "Active",
            type: "boolean",
            options: [
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
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
            name: "code",
            label: "Code",
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
            name: "address_line1",
            label: "Address Line 1",
            type: "text",
            required: true,
          },
          {
            name: "address_line2",
            label: "Address Line 2",
            type: "text",
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
            name: "contact_name",
            label: "Contact Name",
            type: "text",
          },
          {
            name: "contact_email",
            label: "Contact Email",
            type: "text",
          },
          {
            name: "contact_phone",
            label: "Contact Phone",
            type: "text",
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
          {
            name: "price",
            label: "Price",
            type: "number",
            required: true,
          },
        ],
      })
      .setDetailConfig({
        sections: [
          {
            title: "Warehouse Information",
            fields: [
              { label: "Name", field: "name" },
              { label: "Code", field: "code" },
              { label: "Address Line 1", field: "address_line1" },
              { label: "Address Line 2", field: "address_line2" },
              { label: "City", field: "city" },
              { label: "State", field: "state" },
              { label: "Postal Code", field: "postal_code" },
              { label: "Country", field: "country" },
              { label: "Contact Name", field: "contact_name" },
              { label: "Contact Email", field: "contact_email" },
              { label: "Description", field: "description" },
            ],
          },
        ],
        relatedEntities: [
          {
            title: "Inventory",
            entity: "inventory",
            relationField: "warehouse_id",
            display: (item) => `${item.product.name} - ${item.quantity} units`,
          },
        ],
      })
      .build();
  }

  buildInventoryModule(builder: BackofficeBuilder) {
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
          { field: "sku", header: "Sku" },
          { field: "name", header: "Name" },
          { field: "category", header: "Category" },
          { field: "description", header: "Description" },
          { field: "warehouse_name", header: "Warehouse" },
          { field: "quantity", header: "Quantity" },
          {
            field: "price",
            header: "Price",
            render: (value: string | number) => {
              const priceAsNumber =
                typeof value === "string" ? parseFloat(value) : value;
              return `$${priceAsNumber?.toFixed(2)}`;
            },
          },
          {
            field: "attributes",
            header: "Attributes",
            render: (value) => {
              if (!value) return "None";
              try {
                const attrs =
                  typeof value === "string" ? JSON.parse(value) : value;
                return <AttributesBadges attributes={attrs} />;
              } catch (e) {
                return "Invalid format";
              }
            },
          },
        ],
        searchFields: [
          "sku",
          "name",
          "description",
          "warehouse_name",
          "category",
        ],
        filters: [
          {
            field: "warehouse_id",
            label: "Warehouse",
            type: "select",
            options: [],
          },
          {
            field: "category",
            label: "Category",
            type: "select",
            options: [
              { value: "electronics", label: "Electronics" },
              { value: "clothing", label: "Clothing" },
              { value: "furniture", label: "Furniture" },
              { value: "books", label: "Books" },
              { value: "toys", label: "Toys" },
              { value: "food", label: "Food & Beverages" },
              { value: "health", label: "Health & Beauty" },
              { value: "sports", label: "Sports & Outdoors" },
              { value: "automotive", label: "Automotive" },
              { value: "office", label: "Office Supplies" },
              { value: "other", label: "Other" },
            ],
          },
        ],
      })
      .setFormConfig({
        fields: [
          {
            name: "sku",
            label: "Sku",
            type: "text",
            required: true,
          },
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
          },
          {
            name: "category",
            label: "Category",
            type: "select",
            required: true,
            options: [
              { value: "electronics", label: "Electronics" },
              { value: "clothing", label: "Clothing" },
              { value: "furniture", label: "Furniture" },
              { value: "books", label: "Books" },
              { value: "toys", label: "Toys" },
              { value: "food", label: "Food & Beverages" },
              { value: "health", label: "Health & Beauty" },
              { value: "sports", label: "Sports & Outdoors" },
              { value: "automotive", label: "Automotive" },
              { value: "office", label: "Office Supplies" },
              { value: "other", label: "Other" },
            ],
          },
          {
            name: "description",
            label: "Description",
            type: "text",
          },
          {
            name: "warehouse_id",
            label: "Warehouse",
            type: "autocomplete",
            required: true,
            component: ({
              value,
              onChange,
            }: {
              value: string;
              onChange: (value: string) => void;
            }) => (
              <AutocompleteSelect
                value={value || ""}
                onChange={onChange}
                label="Warehouse"
                queryKey="warehouses-search"
                fetchOptions={async (search: string) => {
                  try {
                    const response = await this.apiService.get<
                      ApiResponse<Warehouse>
                    >("/api/warehouses", {
                      params: { search: search },
                    });
                    return response.data.map((warehouse: Warehouse) => ({
                      value: warehouse.id,
                      label: warehouse.name,
                    }));
                  } catch (error) {
                    console.error("Error fetching warehouses:", error);
                    return [];
                  }
                }}
                placeholder="Search for a warehouse..."
              />
            ),
          },
          {
            name: "quantity",
            label: "Quantity",
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
            name: "attributes",
            label: "Attributes",
            type: "custom",
            component: ({
              value,
              onChange,
            }: {
              value: Record<string, string> | string | null | undefined;
              onChange: (value: Record<string, string>) => void;
            }) => {
              // Convert string to object if needed
              let attributesObj: Record<string, string> | null | undefined =
                null;

              if (typeof value === "string") {
                try {
                  attributesObj = JSON.parse(value);
                } catch (e) {
                  attributesObj = {};
                }
              } else if (value !== null && value !== undefined) {
                attributesObj = value;
              }

              return (
                <AttributesEditor
                  value={attributesObj}
                  onChange={(newValue) => {
                    onChange(newValue);
                  }}
                />
              );
            },
          },
        ],
      })
      .setDetailConfig({
        sections: [
          {
            title: "General Information",
            fields: [
              { field: "sku", label: "Sku" },
              { field: "name", label: "Name" },
              { field: "category", label: "Category" },
              { field: "description", label: "Description" },
              { field: "warehouse_name", label: "Warehouse" },
              { field: "quantity", label: "Quantity" },
              { field: "price", label: "Price" },
            ],
          },
          {
            title: "Product Attributes",
            fields: [
              {
                field: "attributes",
                label: "Attributes",
                render: (value) => {
                  if (!value) return "No attributes defined";

                  try {
                    const attrs =
                      typeof value === "string" ? JSON.parse(value) : value;
                    return <AttributesDisplay attributes={attrs} />;
                  } catch (e) {
                    return "Invalid attribute format";
                  }
                },
              },
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
    const moduleBuilder = new BackofficeBuilderImpl(this.apiService);

    const OrderItemsField = ({
      value,
      onChange,
    }: {
      value: any;
      onChange: (value: any) => void;
    }) => {
      const handleUpdateQuantity = (productId: string, newQuantity: number) => {
        const updatedItems = (value || []).map((item: any) => {
          if (item.product_id === productId) {
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
        onChange(updatedItems);
      };

      return (
        <div className="space-y-6">
          <MultiSelectAutocomplete
            values={value || []}
            onChange={(selectedOptions: MultiSelectOption[]) => {
              const orderItems = selectedOptions.map((option) => ({
                product_id: option.id ?? option.value,
                sku: option.sku ?? "",
                name: option.name ?? "",
                quantity: option.quantity ?? 1,
                unit_price: option.price ?? 0,
              }));
              onChange(orderItems);
            }}
            label="Products"
            queryKey="products-search"
            fetchOptions={async (search: string) => {
              try {
                const response = await this.apiService.get<
                  ApiResponse<Product>
                >("/api/inventory", {
                  params: { search: search },
                });
                return response.data.map((product: Product) => {
                  const priceAsNumber =
                    typeof product.price === "string"
                      ? parseFloat(product.price)
                      : product.price;

                  return {
                    value: product.id,
                    label: `${product.name} (${
                      product.sku
                    }) - $${priceAsNumber.toFixed(2)}`,
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    price: priceAsNumber,
                  };
                });
              } catch (error) {
                console.error("Error fetching products:", error);
                return [];
              }
            }}
            placeholder="Search for products to add..."
            required={true}
            allowQuantityChange={false}
          />

          <div className="mt-6">
            <OrderSummary
              items={value || []}
              onUpdateQuantity={handleUpdateQuantity}
            />
          </div>
        </div>
      );
    };

    // Shipping Info Component
    const ShippingInfoField = ({
      value,
      onChange,
    }: {
      value: any;
      onChange: (value: any) => void;
    }) => {
      const [shippingInfo, setShippingInfo] = useState(
        value || {
          order_id: "", // This will be set when the form is submitted
          address_line1: "",
          address_line2: "",
          city: "",
          state: "",
          postal_code: "",
          country: "",
          recipient_name: "",
          recipient_phone: "",
          shipping_method: "standard",
          shipping_cost: 0,
        }
      );

      useEffect(() => {
        if (value) {
          setShippingInfo(value);
        }
      }, [value]);

      const handleChange = (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      ) => {
        const { name, value } = e.target;
        const updatedInfo = {
          ...shippingInfo,
          [name]: value,
        };
        setShippingInfo(updatedInfo);
        onChange(updatedInfo);
      };

      return (
        <div className="space-y-4 p-4 border-2 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-lg font-bold mb-4">Shipping Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-bold">
                Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="recipient_name"
                value={shippingInfo.recipient_name || ""}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-bold">Recipient Phone</label>
              <input
                type="text"
                name="recipient_phone"
                value={shippingInfo.recipient_phone || ""}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 font-bold">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address_line1"
              value={shippingInfo.address_line1 || ""}
              onChange={handleChange}
              className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-bold">Address Line 2</label>
            <input
              type="text"
              name="address_line2"
              value={shippingInfo.address_line2 || ""}
              onChange={handleChange}
              className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-bold">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={shippingInfo.city || ""}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-bold">
                State/Province <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={shippingInfo.state || ""}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-bold">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="postal_code"
                value={shippingInfo.postal_code || ""}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-bold">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                value={shippingInfo.country || ""}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-bold">
                Shipping Method <span className="text-red-500">*</span>
              </label>
              <select
                name="shipping_method"
                value={shippingInfo.shipping_method || "standard"}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                required
              >
                <option value="standard">Standard Shipping</option>
                <option value="express">Express Shipping</option>
                <option value="overnight">Overnight Shipping</option>
                <option value="international">International Shipping</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-bold">
                Shipping Cost <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="shipping_cost"
                value={shippingInfo.shipping_cost || 0}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
        </div>
      );
    };

    // Payment Info Component
    const PaymentInfoField = ({
      value,
      onChange,
    }: {
      value: any;
      onChange: (value: any) => void;
    }) => {
      const [paymentInfo, setPaymentInfo] = useState(
        value || {
          order_id: "", // This will be set when the form is submitted
          payment_method: "credit_card",
          transaction_id: "",
          amount: 0,
          currency: "USD",
        }
      );

      useEffect(() => {
        if (value) {
          setPaymentInfo(value);
        }
      }, [value]);

      const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      ) => {
        const { name, value } = e.target;
        const updatedInfo = {
          ...paymentInfo,
          [name]: value,
        };
        setPaymentInfo(updatedInfo);
        onChange(updatedInfo);
      };

      return (
        <div className="space-y-4 p-4 border-2 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-lg font-bold mb-4">Payment Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-bold">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="payment_method"
                value={paymentInfo.payment_method || "credit_card"}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                required
              >
                <option value="credit_card">Credit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-bold">Transaction ID</label>
              <input
                type="text"
                name="transaction_id"
                value={paymentInfo.transaction_id || ""}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-bold">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={paymentInfo.amount || 0}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-bold">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                name="currency"
                value={paymentInfo.currency || "USD"}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                required
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
        </div>
      );
    };

    const module = moduleBuilder
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
          { field: "customer_name", header: "Customer" },
          {
            field: "total_amount",
            header: "Total Amount",
            render: (value) => `$${parseFloat(value).toFixed(2)}`,
          },
          {
            field: "status",
            header: "Status",
            render: (value) => {
              const getStatusClass = (status: string) => {
                switch (status?.toLowerCase()) {
                  case "pending":
                    return "text-yellow-600 bg-yellow-100 px-2 py-1 rounded";
                  case "processing":
                    return "text-blue-600 bg-blue-100 px-2 py-1 rounded";
                  case "shipped":
                    return "text-purple-600 bg-purple-100 px-2 py-1 rounded";
                  case "delivered":
                    return "text-green-600 bg-green-100 px-2 py-1 rounded";
                  case "cancelled":
                    return "text-red-600 bg-red-100 px-2 py-1 rounded";
                  default:
                    return "text-gray-600 bg-gray-100 px-2 py-1 rounded";
                }
              };
              return <span className={getStatusClass(value)}>{value}</span>;
            },
          },
          {
            field: "created_at",
            header: "Created At",
            render: (value) => new Date(value).toLocaleDateString(),
          },
        ],
        searchFields: ["order_number", "customer.name"],
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
            name: "customer_id",
            label: "Customer",
            type: "autocomplete",
            required: true,
            component: ({
              value,
              onChange,
            }: {
              value: string;
              onChange: (value: string) => void;
            }) => (
              <AutocompleteSelect
                value={value || ""}
                onChange={onChange}
                label="Customer"
                queryKey="customers-search"
                fetchOptions={async (search: string) => {
                  try {
                    const response = await this.apiService.get<
                      ApiResponse<Customer>
                    >("/api/customers", {
                      params: { search: search },
                    });
                    return response.data.map((customer: Customer) => ({
                      value: customer.id,
                      label: customer.name,
                    }));
                  } catch (error) {
                    console.error("Error fetching customers:", error);
                    return [];
                  }
                }}
                placeholder="Search for a customer..."
              />
            ),
          },
          {
            name: "items",
            label: "Order Items",
            type: "custom",
            required: true,
            component: OrderItemsField,
          },
          {
            name: "shipping_info",
            label: "Shipping Information",
            type: "custom",
            required: true,
            component: ShippingInfoField,
          },
          {
            name: "payment_info",
            label: "Payment Information",
            type: "custom",
            required: true,
            component: PaymentInfoField,
          },
          {
            name: "notes",
            label: "Order Notes",
            type: "textarea",
            required: false,
          },
          {
            name: "currency",
            label: "Currency",
            type: "select",
            required: true,
            options: [
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
              { value: "GBP", label: "GBP" },
              { value: "CAD", label: "CAD" },
              { value: "AUD", label: "AUD" },
              { value: "JPY", label: "JPY" },
            ],
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
        ],
      })
      .setDetailConfig({
        sections: [
          {
            title: "Order Information",
            fields: [
              { field: "id", label: "Order ID" },
              { field: "order_number", label: "Order Number" },
              { field: "customer.name", label: "Customer" },
              {
                field: "total_amount",
                label: "Total Amount",
                render: (value) => `$${parseFloat(value).toFixed(2)}`,
              },
              {
                field: "status",
                label: "Status",
                render: (value) => {
                  const getStatusClass = (status: string) => {
                    switch (status?.toLowerCase()) {
                      case "pending":
                        return "text-yellow-600 bg-yellow-100 px-2 py-1 rounded";
                      case "processing":
                        return "text-blue-600 bg-blue-100 px-2 py-1 rounded";
                      case "shipped":
                        return "text-purple-600 bg-purple-100 px-2 py-1 rounded";
                      case "delivered":
                        return "text-green-600 bg-green-100 px-2 py-1 rounded";
                      case "cancelled":
                        return "text-red-600 bg-red-100 px-2 py-1 rounded";
                      default:
                        return "text-gray-600 bg-gray-100 px-2 py-1 rounded";
                    }
                  };
                  return <span className={getStatusClass(value)}>{value}</span>;
                },
              },
              { field: "notes", label: "Notes" },
              {
                field: "created_at",
                label: "Created At",
                render: (value) => new Date(value).toLocaleDateString(),
              },
              {
                field: "updated_at",
                label: "Updated At",
                render: (value) => new Date(value).toLocaleDateString(),
              },
            ],
          },
          {
            title: "Order Items",
            fields: [
              {
                field: "items",
                label: "Order Items",
                render: (items) => {
                  return (
                    <div className="mt-4">
                      <OrderSummary items={items || []} />
                    </div>
                  );
                },
              },
            ],
          },
          {
            title: "Shipping Information",
            fields: [
              {
                field: "shipping_info.recipient_name",
                label: "Recipient Name",
              },
              {
                field: "shipping_info.recipient_phone",
                label: "Recipient Phone",
              },
              { field: "shipping_info.address_line1", label: "Address Line 1" },
              { field: "shipping_info.address_line2", label: "Address Line 2" },
              { field: "shipping_info.city", label: "City" },
              { field: "shipping_info.state", label: "State/Province" },
              { field: "shipping_info.postal_code", label: "Postal Code" },
              { field: "shipping_info.country", label: "Country" },
              {
                field: "shipping_info.shipping_method",
                label: "Shipping Method",
              },
              {
                field: "shipping_info.shipping_cost",
                label: "Shipping Cost",
                render: (value) => `$${parseFloat(value).toFixed(2)}`,
              },
              {
                field: "shipping_info.tracking_number",
                label: "Tracking Number",
              },
            ],
          },
          {
            title: "Payment Information",
            fields: [
              { field: "payment_info.payment_method", label: "Payment Method" },
              { field: "payment_info.transaction_id", label: "Transaction ID" },
              {
                field: "payment_info.amount",
                label: "Amount",
                render: (value) => `$${parseFloat(value).toFixed(2)}`,
              },
              { field: "payment_info.currency", label: "Currency" },
              { field: "payment_info.status", label: "Payment Status" },
              {
                field: "payment_info.is_paid",
                label: "Is Paid",
                render: (value) => (value ? "Yes" : "No"),
              },
              {
                field: "payment_info.payment_date",
                label: "Payment Date",
                render: (value) =>
                  value ? new Date(value).toLocaleDateString() : "N/A",
              },
            ],
          },
        ],
      })
      .build();

    // Now we can access the module's methods
    const originalCreateItem = module.createItem;
    module.createItem = async (data: any) => {
      console.log("Original data:", JSON.stringify(data, null, 2));

      // Create a copy of the data to modify
      const modifiedData = { ...data };

      // Generate a temporary UUID for the order_id
      // This will be replaced by the server, but is needed for validation
      const tempOrderId = generateUUID();

      // Validate and set the shipping_info
      if (modifiedData.shipping_info) {
        // Ensure shipping_cost is a number
        if (typeof modifiedData.shipping_info.shipping_cost === "string") {
          modifiedData.shipping_info.shipping_cost = parseFloat(
            modifiedData.shipping_info.shipping_cost
          );
        }

        modifiedData.shipping_info = {
          ...modifiedData.shipping_info,
          order_id: tempOrderId,
        };
      }

      // Validate and set the payment_info
      if (modifiedData.payment_info) {
        // Ensure amount is a number
        if (typeof modifiedData.payment_info.amount === "string") {
          modifiedData.payment_info.amount = parseFloat(
            modifiedData.payment_info.amount
          );
        }

        modifiedData.payment_info = {
          ...modifiedData.payment_info,
          order_id: tempOrderId,
        };
      }

      console.log("Modified data:", JSON.stringify(modifiedData, null, 2));

      // Call the original createItem method with the modified data
      return originalCreateItem(modifiedData);
    };

    // Add a custom updateItem method to handle the order_id for nested objects
    const originalUpdateItem = module.updateItem;
    module.updateItem = async (id: string, data: any) => {
      console.log("Original update data:", JSON.stringify(data, null, 2));

      const modifiedData = { ...data };

      if (modifiedData.shipping_info) {
        if (typeof modifiedData.shipping_info.shipping_cost === "string") {
          modifiedData.shipping_info.shipping_cost = parseFloat(
            modifiedData.shipping_info.shipping_cost
          );
        }

        modifiedData.shipping_info = {
          ...modifiedData.shipping_info,
          order_id: id,
        };
      }

      // Validate and set the payment_info
      if (modifiedData.payment_info) {
        // Ensure amount is a number
        if (typeof modifiedData.payment_info.amount === "string") {
          modifiedData.payment_info.amount = parseFloat(
            modifiedData.payment_info.amount
          );
        }

        modifiedData.payment_info = {
          ...modifiedData.payment_info,
          order_id: id,
        };
      }

      console.log(
        "Modified update data:",
        JSON.stringify(modifiedData, null, 2)
      );

      // Call the original updateItem method with the modified data
      return originalUpdateItem(id, modifiedData);
    };

    return module;
  }
}

// Helper function to generate a UUID
function generateUUID() {
  // Check if crypto.randomUUID is available (modern browsers)
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
