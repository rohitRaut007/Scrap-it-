import type { ApiEnvelope } from "@scrap-it/types";

export type GetAccessToken = () => Promise<string | null | undefined>;

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: GetAccessToken;
}

export interface ScrapItApiClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
  getEnvelope<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>>;
}

export function createApiClient(options: ApiClientOptions): ScrapItApiClient {
  const base = options.baseUrl.replace(/\/$/, "");

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = new Headers(init?.headers);
    const token = await options.getAccessToken?.();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }
    return (await res.json()) as T;
  }

  return {
    request,
    async getEnvelope<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
      return request<ApiEnvelope<T>>(path, init);
    },
  };
}
