import { ApiService } from "@/services/api.service";
import {
  BackofficeConfig,
  BackofficeDetailConfig,
  BackofficeFormConfig,
  BackofficeListConfig,
} from "../atoms/config";
import { NavItem } from "../atoms/types";
import { BackofficeBuilder } from "../molecules/BackofficeBuilder";
import { BackofficeModule } from "../molecules/BackofficeModule";

export class BackofficeBuilderImpl implements BackofficeBuilder {
  private readonly apiService: ApiService;
  private config: BackofficeConfig | undefined;
  private apiEndpoint: string | undefined;
  private navItem: NavItem | undefined;
  private listConfig: BackofficeListConfig | undefined;
  private formConfig: BackofficeFormConfig | undefined;
  private detailConfig: BackofficeDetailConfig | undefined;
  private queryInvalidations: string[] = [];

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  setConfig(config: BackofficeConfig): BackofficeBuilder {
    this.config = config;
    return this;
  }

  setApiEndpoint(endpoint: string): BackofficeBuilder {
    this.apiEndpoint = endpoint;
    // Add the API endpoint to query invalidations by default
    this.addQueryInvalidation(endpoint);
    return this;
  }

  setNavItem(navItem: NavItem): BackofficeBuilder {
    this.navItem = navItem;
    return this;
  }

  setListConfig(config: BackofficeListConfig): BackofficeBuilder {
    this.listConfig = config;
    return this;
  }

  setFormConfig(config: BackofficeFormConfig): BackofficeBuilder {
    this.formConfig = config;
    return this;
  }

  setDetailConfig(config: BackofficeDetailConfig): BackofficeBuilder {
    this.detailConfig = config;
    return this;
  }

  addQueryInvalidation(queryKey: string): BackofficeBuilder {
    if (!this.queryInvalidations.includes(queryKey)) {
      this.queryInvalidations.push(queryKey);
    }
    return this;
  }

  build(): BackofficeModule {
    if (!this.config) {
      throw new Error("BackofficeConfig must be set before building a module");
    }

    if (!this.apiEndpoint) {
      throw new Error("API endpoint must be set before building a module");
    }

    const moduleName = this.config.title.toLowerCase();

    return {
      config: this.config,
      apiEndpoint: this.apiEndpoint,

      fetchList: async (params?: Record<string, any>) => {
        console.log("Fetching from endpoint:", this.apiEndpoint);
        return this.apiService.get(`${this.apiEndpoint}`, { params });
      },

      fetchItem: async (id: string) => {
        return this.apiService.get(`${this.apiEndpoint}/${id}`);
      },

      createItem: async (data: any) => {
        return this.apiService.post(`${this.apiEndpoint}`, data);
      },

      updateItem: async (id: string, data: any) => {
        return this.apiService.put(`${this.apiEndpoint}/${id}`, data);
      },

      deleteItem: async (id: string) => {
        return this.apiService.delete(`${this.apiEndpoint}/${id}`);
      },

      listConfig: this.listConfig,
      formConfig: this.formConfig,
      detailConfig: this.detailConfig,
      navItem: this.navItem,

      getListPath: () => `${this.config?.basePath}`,
      getDetailPath: (id: string) => `${this.config?.basePath}/${id}`,
      getCreatePath: () => `${this.config?.basePath}/create`,
      getEditPath: (id: string) => `${this.config?.basePath}/${id}/edit`,
      getNavItem: () => this.navItem,

      // Query keys for React Query invalidation
      getQueryKeys: () => ({
        list: moduleName,
        detail: (id?: string) =>
          id ? `${moduleName}-${id}` : `${moduleName}-detail`,
      }),

      queryInvalidations: [...this.queryInvalidations],
      apiService: this.apiService,
    };
  }

  reset(): void {
    this.config = undefined;
    this.apiEndpoint = undefined;
    this.navItem = undefined;
    this.listConfig = undefined;
    this.formConfig = undefined;
    this.detailConfig = undefined;
    this.queryInvalidations = [];
  }
}
