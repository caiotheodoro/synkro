import {
  BackofficeConfig,
  BackofficeListConfig,
  BackofficeFormConfig,
  BackofficeDetailConfig,
  NavItem,
} from "../types";
import { BackofficeModule } from "./BackofficeModule";

export interface BackofficeBuilder {
  /**
   * Set the base configuration for the backoffice module
   */
  setConfig(config: BackofficeConfig): BackofficeBuilder;

  /**
   * Set the API endpoint for the backoffice module
   * This endpoint will be used for CRUD operations
   */
  setApiEndpoint(endpoint: string): BackofficeBuilder;

  /**
   * Set the navigation item for the sidebar
   */
  setNavItem(navItem: NavItem): BackofficeBuilder;

  /**
   * Configure the list view for this module
   */
  setListConfig(config: BackofficeListConfig): BackofficeBuilder;

  /**
   * Configure the form for this module
   */
  setFormConfig(config: BackofficeFormConfig): BackofficeBuilder;

  /**
   * Configure the detail view for this module
   */
  setDetailConfig(config: BackofficeDetailConfig): BackofficeBuilder;

  /**
   * Add a query key to be invalidated when operations are performed
   */
  addQueryInvalidation(queryKey: string): BackofficeBuilder;

  /**
   * Build the backoffice module with the configured settings
   */
  build(): BackofficeModule;

  /**
   * Reset the builder to its initial state
   */
  reset(): void;
}
