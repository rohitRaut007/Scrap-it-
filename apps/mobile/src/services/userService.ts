import type { MeResponse } from "@/api/auth";
import { api } from "@/lib/api";
import type { User } from "@/types/domain";

function mapMe(res: MeResponse): User | null {
  const u = res.user;
  if (!u?.id) return null;
  return {
    id: u.id,
    email: u.email ?? "",
    name: u.name ?? null,
    phone: u.phone ?? null,
    role: u.role,
    defaultAddress: u.defaultAddress ?? null,
  };
}

export type UpdateProfileInput = {
  name?: string;
  phone?: string;
};

export const userService = {
  async getCurrent(): Promise<User> {
    const me = await api.get<MeResponse>("/auth/me");
    const user = mapMe(me);
    if (!user) {
      throw new Error("Not authenticated");
    }
    return user;
  },

  async updateCurrent(input: UpdateProfileInput): Promise<User> {
    const body: Record<string, string> = {};
    if (input.name !== undefined) body.name = input.name;
    if (input.phone !== undefined) body.phone = input.phone;
    const me = await api.patch<MeResponse>("/auth/me", body);
    const user = mapMe(me);
    if (!user) {
      throw new Error("Not authenticated");
    }
    return user;
  },
};
