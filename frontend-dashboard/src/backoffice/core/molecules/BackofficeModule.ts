import { ApiService } from "@/services/api.service";
import {
  BackofficeConfig,
  BackofficeListConfig,
  BackofficeFormConfig,
  BackofficeDetailConfig,
  NavItem,
} from "../types";

/**
 * Represents a complete backoffice module configuration
 * This is the output of the BackofficeBuilder
 */
export interface BackofficeModule {
  /**
   * Base configuration for the module
   */
  config: BackofficeConfig;

  /**
   * API endpoint for CRUD operations
   */
  apiEndpoint: string;

  /**
   * Navigation item for the sidebar (optional)
   */
  navItem?: NavItem;

  /**
   * Configuration for the list view (optional)
   */
  listConfig?: BackofficeListConfig;

  /**
   * Configuration for the form (optional)
   */
  formConfig?: BackofficeFormConfig;

  /**
   * Configuration for the detail view (optional)
   */
  detailConfig?: BackofficeDetailConfig;

  /**
   * Query keys to invalidate when operations are performed
   */
  queryInvalidations: string[];

  /**
   * API service instance to use for operations
   */
  apiService: ApiService;
}
