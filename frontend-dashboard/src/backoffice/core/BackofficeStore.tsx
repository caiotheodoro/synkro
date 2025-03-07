import { create } from "zustand";
import { BackofficeBuilder } from "./BackofficeBuilder";
import { BackofficeDirector } from "./BackofficeDirector";

export interface BackofficeModule {
  [key: string]: any;
}

interface BackofficeState {
  modules: Record<string, BackofficeModule>;
  getModule: (name: string) => BackofficeModule | undefined;
  initialize: (apiBaseUrl: string) => void;
  isInitialized: boolean;
  getModuleByPathSegment: (pathSegment: string) => BackofficeModule | undefined;
}

export const useBackofficeStore = create<BackofficeState>((set, get) => ({
  modules: {},
  isInitialized: false,
  getModule: (name: string) => {
    console.log("Getting module:", name);
    console.log("Available modules:", Object.keys(get().modules));
    return get().modules[name];
  },
  getModuleByPathSegment: (pathSegment: string) => {
    // Handle various formats (case-insensitive, singular/plural, etc.)
    const normalizedSegment = pathSegment.toLowerCase();
    const modules = get().modules;

    console.log("Looking for module with path segment:", pathSegment);
    console.log("Normalized segment:", normalizedSegment);
    console.log("Available modules:", Object.keys(modules));

    // Direct match
    if (modules[normalizedSegment]) {
      console.log("Found direct match for:", normalizedSegment);
      return modules[normalizedSegment];
    }

    // Try singular version if plural was provided
    if (normalizedSegment.endsWith("s")) {
      const singularKey = normalizedSegment.slice(0, -1);
      console.log("Trying singular version:", singularKey);
      if (modules[singularKey]) {
        console.log("Found match with singular key:", singularKey);
        return modules[singularKey];
      }
    }

    // Try plural version if singular was provided
    const pluralKey = normalizedSegment + "s";
    console.log("Trying plural version:", pluralKey);
    if (modules[pluralKey]) {
      console.log("Found match with plural key:", pluralKey);
      return modules[pluralKey];
    }

    // If all else fails, check object keys one by one
    for (const key of Object.keys(modules)) {
      if (key.toLowerCase() === normalizedSegment) {
        console.log("Found case-insensitive match:", key);
        return modules[key];
      }
    }

    console.log("No module found for segment:", pathSegment);
    return undefined;
  },
  initialize: (apiBaseUrl: string) => {
    if (get().isInitialized) return;

    console.log("Initializing backoffice store with API URL:", apiBaseUrl);

    const director = new BackofficeDirector(apiBaseUrl);

    const dummyBuilder = {} as BackofficeBuilder;

    const customerModule = director.buildCustomerModule(dummyBuilder);
    const warehouseModule = director.buildWarehouseModule(dummyBuilder);
    const inventoryModule = director.buildInventoryModule(dummyBuilder);
    const orderModule = director.buildOrderModule(dummyBuilder);

    console.log("Created modules with endpoints:", {
      customers: customerModule.apiEndpoint,
      warehouses: warehouseModule.apiEndpoint,
      inventory: inventoryModule.apiEndpoint,
      orders: orderModule.apiEndpoint,
    });

    set({
      modules: {
        customers: customerModule,
        warehouses: warehouseModule,
        inventory: inventoryModule,
        orders: orderModule,
      },
      isInitialized: true,
    });
  },
}));
