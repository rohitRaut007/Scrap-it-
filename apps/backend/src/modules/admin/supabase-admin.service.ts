import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

/**
 * Thin wrapper around the Supabase Admin API (service-role key), used to
 * provision collector auth accounts from the admin app. Mirrors the pattern
 * proven in prisma/provision-collector-*.js, promoted into the running app.
 */
@Injectable()
export class SupabaseAdminService {
  private clientCache: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  private getClient(): SupabaseClient {
    if (this.clientCache) return this.clientCache;

    const supabaseUrl = this.config.get<string>("supabaseUrl");
    const serviceRoleKey = this.config.get<string>("supabaseServiceRoleKey");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new InternalServerErrorException(
        "Supabase admin client is not configured (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
      );
    }

    this.clientCache = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return this.clientCache;
  }

  /** Secure random temp password, copy-paste friendly (not hand-typed). */
  generateTempPassword(): string {
    return `Sc-${randomBytes(9).toString("base64url")}`;
  }

  /** Supabase admin SDK has no lookup-by-email — page through listUsers(). */
  async findUserByEmail(email: string) {
    const supabase = this.getClient();
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    return data.users.find((u) => u.email === email) ?? null;
  }

  /**
   * Creates a new Supabase auth user for a collector, or updates the
   * existing one (password + metadata refresh) if the email is already
   * registered. Idempotent — safe to call again for the same email, which
   * is exactly what a "re-invite after removal" does.
   */
  async createOrUpdateAuthUser(params: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ id: string; isNewUser: boolean }> {
    const supabase = this.getClient();
    const existing = await this.findUserByEmail(params.email);

    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(
        existing.id,
        {
          password: params.password,
          email_confirm: true,
          app_metadata: { role: "collector" },
          user_metadata: { name: params.name },
        },
      );
      if (error) throw error;
      return { id: existing.id, isNewUser: false };
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      app_metadata: { role: "collector" },
      user_metadata: { name: params.name },
    });
    if (error) throw error;
    return { id: data.user.id, isNewUser: true };
  }
}
