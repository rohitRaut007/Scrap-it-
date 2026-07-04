import { createApiClient } from "@scrap-it/api-client";
import { supabase } from "./supabase";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Parse the status code and message from the api-client's error string:
 * "HTTP 422: {"message":"...","statusCode":422}"
 */
function parseApiError(err: unknown): ApiError {
  if (err instanceof Error) {
    const match = /^HTTP (\d+): (.+)$/.exec(err.message);
    if (match) {
      const status = parseInt(match[1], 10);
      let message = match[2];
      try {
        const body = JSON.parse(message) as { message?: string | string[] };
        if (Array.isArray(body.message)) {
          message = body.message.join(", ");
        } else if (typeof body.message === "string") {
          message = body.message;
        }
      } catch {
        // keep raw message
      }
      return new ApiError(status, message);
    }
  }
  return new ApiError(0, String(err));
}

const _client = createApiClient({
  baseUrl: BASE_URL,
  getAccessToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
});

/** Typed API client that throws `ApiError` with parsed status codes. */
export const adminApi = {
  async request<T>(path: string, init?: RequestInit): Promise<T> {
    try {
      return await _client.request<T>(path, init);
    } catch (err) {
      throw parseApiError(err);
    }
  },
};
