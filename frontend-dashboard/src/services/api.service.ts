import { authService } from "./auth.service";

interface ApiOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

interface RequestConfig extends RequestInit {
  timeout?: number;
  params?: Record<string, string>;
}

export class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(options: ApiOptions) {
    this.baseUrl = options.baseUrl;
    this.defaultHeaders = options.headers || {};
    this.defaultTimeout = options.timeout || 30000;
  }

  private createUrl(endpoint: string, params?: Record<string, string>): string {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

    // Normalize base URL to not end with trailing slash
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

  private async applyAuthInterceptor(
    config: RequestConfig
  ): Promise<RequestConfig> {
    const token = authService.getToken();

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  }

  private async applyResponseInterceptor(
    response: Response
  ): Promise<Response> {
    if (response.status === 401) {
      authService.clearAuth();
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    return response;
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestConfig
  ): Promise<Response> {
    // Use a default timeout of 30 seconds if not specified
    const timeout = config.timeout || this.defaultTimeout || 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      return await this.applyResponseInterceptor(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async request<T>(
    method: string,
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const mergedConfig: RequestConfig = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...this.defaultHeaders,
        ...config.headers,
      },
      timeout: config.timeout || this.defaultTimeout || 30000,
      ...config,
    };

    const configWithAuth = await this.applyAuthInterceptor(mergedConfig);
    const url = this.createUrl(endpoint, config.params);

    // Add debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log(`API Request: ${method} ${url}`);
      console.log("Request config:", configWithAuth);
    }

    try {
      const response = await this.fetchWithTimeout(url, configWithAuth);

      // Add debug logging in development
      if (process.env.NODE_ENV === "development") {
        console.log(`API Response: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(
          errorData.message || `Request failed with status ${response.status}`
        );
      }

      // Check if the response is empty
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        return (await response.text()) as unknown as T;
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.error(
            `Request timeout after ${configWithAuth.timeout}ms for ${url}`
          );
          throw new Error(`Request timeout after ${configWithAuth.timeout}ms`);
        }

        console.error(`API Request failed for ${url}:`, error);
      }
      throw error;
    }
  }

  public get<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>("GET", endpoint, config);
  }

  public post<T>(
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>("POST", endpoint, {
      ...config,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public put<T>(
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>("PUT", endpoint, {
      ...config,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public delete<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>("DELETE", endpoint, config);
  }

  public patch<T>(
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>("PATCH", endpoint, {
      ...config,
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
