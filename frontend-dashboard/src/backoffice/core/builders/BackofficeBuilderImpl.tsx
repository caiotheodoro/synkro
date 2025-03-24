import {
  BackofficeBuilder,
  BackofficeConfig,
  BackofficeDetailConfig,
  BackofficeFormConfig,
  BackofficeListConfig,
} from './BackofficeBuilder';

import { ApiService } from '@/services/api.service';


interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}
export class BackofficeBuilderImpl implements BackofficeBuilder {
  private config: BackofficeConfig | null = null;
  private listConfig: BackofficeListConfig | null = null;
  private formConfig: BackofficeFormConfig | null = null;
  private detailConfig: BackofficeDetailConfig | null = null;
  private apiEndpoint: string | null = null;
  private readonly apiService: ApiService;
  private navItem: NavItem | null = null;
  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  setConfig(config: BackofficeConfig): BackofficeBuilder {
    this.config = config;
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

  setApiEndpoint(endpoint: string): BackofficeBuilder {
    this.apiEndpoint = endpoint;
    return this;
  }

  setNavItem(item: NavItem): BackofficeBuilder {
    this.navItem = item;
    return this;
  }

  build() {
    if (!this.config) {
      throw new Error('Backoffice config is required');
    }

    if (!this.apiEndpoint) {
      throw new Error('API endpoint is required');
    }

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
    };
  }
} 