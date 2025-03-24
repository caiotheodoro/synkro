export interface IApiOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface IRequestConfig extends RequestInit {
  timeout?: number;
  params?: Record<string, string>;
}

export interface IApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}
