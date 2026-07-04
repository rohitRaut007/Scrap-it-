import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { passportJwtSecret } from "jwks-rsa";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { UserRole } from "@scrap-it/types";
import { PrismaService } from "../../../database/prisma.service";

export interface JwtPayload {
  sub: string;
  email?: string;
  /** Supabase uses `authenticated` / `anon`; app roles live in app_metadata.role when set. */
  role?: string;
  app_metadata?: { role?: UserRole };
  user_metadata?: { email?: string };
}

function resolveEmailFromPayload(payload: JwtPayload): string | undefined {
  if (typeof payload.email === "string" && payload.email.trim()) {
    return payload.email.trim();
  }
  const meta = payload.user_metadata?.email;
  if (typeof meta === "string" && meta.trim()) {
    return meta.trim();
  }
  return undefined;
}

function resolveUserRole(payload: JwtPayload): UserRole {
  const fromMeta = payload.app_metadata?.role;
  if (fromMeta === "admin" || fromMeta === "collector" || fromMeta === "customer") {
    return fromMeta;
  }
  const raw = payload.role;
  if (raw === "admin" || raw === "collector" || raw === "customer") {
    return raw;
  }
  return "customer";
}

export interface AuthUser {
  id: string;
  email?: string;
  role: UserRole;
}

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, "jwt") {
  // In-memory fingerprint of the last (email, role) we synced per user, so
  // we don't pay a DB write round trip on every single authenticated
  // request — only when a user is seen for the first time in this process
  // or their email/role actually changed. This directly affects every
  // route in the app (all requests pass through here), so it's the
  // highest-leverage place to cut a redundant round trip.
  private readonly syncedFingerprint = new Map<string, string>();

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = config.getOrThrow<string>("SUPABASE_URL").replace(/\/$/, "");
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ["ES256"],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const email = resolveEmailFromPayload(payload);
    if (!email) {
      throw new UnauthorizedException("JWT missing email claim");
    }
    const role = resolveUserRole(payload);

    const fingerprint = `${email}:${role}`;
    if (this.syncedFingerprint.get(payload.sub) !== fingerprint) {
      await this.prisma.user.upsert({
        where: { id: payload.sub },
        update: { email, role },
        create: { id: payload.sub, email, role },
      });
      this.syncedFingerprint.set(payload.sub, fingerprint);
    }

    return {
      id: payload.sub,
      email,
      role,
    };
  }
}
