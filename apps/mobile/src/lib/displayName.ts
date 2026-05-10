import type { User } from "@/types/domain";

export function displayNameFromUser(user: Pick<User, "name" | "email">): string {
  const n = user.name?.trim();
  if (n) return n;
  const email = user.email?.trim();
  if (email) {
    const local = email.split("@")[0];
    if (local) return local;
  }
  return "there";
}
