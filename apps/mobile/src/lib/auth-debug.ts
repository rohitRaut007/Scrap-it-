/**
 * Dev-only helpers for tracing sign-in → /auth/me without logging secrets.
 * Never log full JWTs or passwords.
 */

const PREFIX = "[Scrap-it/auth]";

export function authDebugLog(
  message: string,
  data?: Record<string, unknown>,
): void {
  if (!__DEV__) return;
  if (data !== undefined) {
    console.log(`${PREFIX} ${message}`, data);
  } else {
    console.log(`${PREFIX} ${message}`);
  }
}

/** Decode JWT header + payload for logging only — not verified. */
export function summarizeAccessToken(token: string | null): {
  present: boolean;
  tokenLength?: number;
  alg?: string;
  kid?: string;
  sub?: string;
  email?: string;
  userMetadataEmail?: string;
  iss?: string;
  exp?: number;
  aud?: unknown;
} {
  if (!token?.trim()) {
    return { present: false };
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { present: true, tokenLength: token.length };
  }
  const decode = (segment: string) => {
    const padded = segment + "=".repeat((4 - (segment.length % 4)) % 4);
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  };
  try {
    const header = decode(parts[0]);
    const payload = decode(parts[1]);
    const userMeta = payload.user_metadata as Record<string, unknown> | undefined;
    const metaEmail =
      typeof userMeta?.email === "string" ? userMeta.email : undefined;
    return {
      present: true,
      tokenLength: token.length,
      alg: typeof header.alg === "string" ? header.alg : undefined,
      kid: typeof header.kid === "string" ? header.kid : undefined,
      sub: typeof payload.sub === "string" ? payload.sub : undefined,
      email: typeof payload.email === "string" ? payload.email : undefined,
      userMetadataEmail: metaEmail,
      iss: typeof payload.iss === "string" ? payload.iss : undefined,
      exp: typeof payload.exp === "number" ? payload.exp : undefined,
      aud: payload.aud,
    };
  } catch {
    return { present: true, tokenLength: token.length };
  }
}
