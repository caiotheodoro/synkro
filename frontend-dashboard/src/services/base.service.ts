import {
  IApiOptions,
  IRequestConfig,
  IApiResponse,
} from "../models/interfaces/api.interface";

export abstract class BaseService {
  protected baseUrl: string;
  protected defaultHeaders: Record<string, string>;
  protected defaultTimeout: number;

  constructor(options: IApiOptions) {
    this.baseUrl = options.baseUrl;
    this.defaultHeaders = options.headers || {};
    this.defaultTimeout = options.timeout ?? 30000;
  }

  protected createUrl(
    endpoint: string,
    params?: Record<string, string>
  ): string {
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    const normalizedBaseUrl = this.baseUrl.endsWith("/")
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    const url = new URL(`${normalizedBaseUrl}${normalizedEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  protected async fetchWithTimeout(
    url: string,
    config: IRequestConfig
  ): Promise<Response> {
    const timeout = config.timeout ?? this.defaultTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  protected async request<T>(
    method: string,
    endpoint: string,
    config: IRequestConfig = {}
  ): Promise<IApiResponse<T>> {
    const mergedConfig: IRequestConfig = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...this.defaultHeaders,
        ...config.headers,
      },
      timeout: config.timeout || this.defaultTimeout,
      ...config,
    };

    const url = this.createUrl(endpoint, config.params);

    if (process.env.NODE_ENV === "development") {
      console.log(`API Request: ${method} ${url}`);
      console.log("Request config:", mergedConfig);
    }

    try {
      const response = await this.fetchWithTimeout(url, mergedConfig);

      if (process.env.NODE_ENV === "development") {
        console.log(`API Response: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Request failed with status ${response.status}`
        );
      }

      const contentType = response.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(`Request timeout after ${mergedConfig.timeout}ms`);
        }
        console.error(`API Request failed for ${url}:`, error);
      }
      throw error;
    }
  }

  protected get<T>(
    endpoint: string,
    config: IRequestConfig = {}
  ): Promise<IApiResponse<T>> {
    return this.request<T>("GET", endpoint, config);
  }

  protected post<T>(
    endpoint: string,
    data?: unknown,
    config: IRequestConfig = {}
  ): Promise<IApiResponse<T>> {
    return this.request<T>("POST", endpoint, {
      ...config,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected put<T>(
    endpoint: string,
    data?: unknown,
    config: IRequestConfig = {}
  ): Promise<IApiResponse<T>> {
    return this.request<T>("PUT", endpoint, {
      ...config,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected delete<T>(
    endpoint: string,
    config: IRequestConfig = {}
  ): Promise<IApiResponse<T>> {
    return this.request<T>("DELETE", endpoint, config);
  }

  protected patch<T>(
    endpoint: string,
    data?: unknown,
    config: IRequestConfig = {}
  ): Promise<IApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, {
      ...config,
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
