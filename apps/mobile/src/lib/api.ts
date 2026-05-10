import { authDebugLog, summarizeAccessToken } from "@/lib/auth-debug";
import { supabase } from "@/lib/supabase";

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (__DEV__ && !baseUrl) {
  console.warn(
    "[@scrap-it/mobile] API: set EXPO_PUBLIC_API_BASE_URL in .env (e.g. http://10.0.2.2:3001 for Android emulator, http://localhost:3001 for iOS simulator).",
  );
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function authHeader(
  accessTokenOverride?: string | null,
): Promise<Record<string, string>> {
  if (accessTokenOverride) {
    return { Authorization: `Bearer ${accessTokenOverride}` };
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type ApiGetOptions = {
  /** Prefer passing this right after sign-in so the request is not sent before AsyncStorage catches up. */
  accessToken?: string | null;
};

async function request<T>(
  path: string,
  init: RequestInit = {},
  apiOptions?: ApiGetOptions,
): Promise<T> {
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not set");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await authHeader(apiOptions?.accessToken)),
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (__DEV__) {
    const auth = headers.Authorization;
    const override = Boolean(apiOptions?.accessToken);
    authDebugLog(`${init.method ?? "GET"} ${path}`, {
      baseUrl,
      authorization: auth ? "Bearer <present>" : "missing",
      usedAccessTokenOverride: override,
      overrideTokenSummary: override
        ? summarizeAccessToken(apiOptions?.accessToken ?? null)
        : undefined,
    });
  }
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Cannot reach API at ${baseUrl}: ${detail}. Use the correct URL for your setup (emulator: http://10.0.2.2:PORT; device: your PC LAN IP). Ensure the backend is running and Windows Firewall allows inbound TCP on that port.`,
    );
  }
  const text = await res.text();
  const body = text ? safeParse(text) : undefined;
  if (!res.ok) {
    const message =
      normalizeApiErrorMessage(body) ?? `HTTP ${res.status}`;
    if (__DEV__) {
      authDebugLog(`API error ${res.status} ${path}`, {
        message,
        body:
          typeof body === "object" && body !== null
            ? body
            : typeof body === "string"
              ? body.slice(0, 200)
              : body,
      });
    }
    throw new ApiError(res.status, message, body);
  }
  return body as T;
}

function normalizeApiErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { message?: unknown }).message;
  if (raw === undefined) return null;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x)).filter(Boolean).join(", ") || null;
  }
  if (typeof raw === "object" && raw !== null && "message" in raw) {
    return normalizeApiErrorMessage(raw);
  }
  return String(raw);
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  get: <T>(path: string, options?: ApiGetOptions) =>
    request<T>(path, { method: "GET" }, options),
  post: <T>(path: string, body?: unknown, options?: ApiGetOptions) =>
    request<T>(
      path,
      {
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      options,
    ),
  patch: <T>(path: string, body?: unknown, options?: ApiGetOptions) =>
    request<T>(
      path,
      {
        method: "PATCH",
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      options,
    ),
  delete: <T>(path: string, options?: ApiGetOptions) =>
    request<T>(path, { method: "DELETE" }, options),
};
