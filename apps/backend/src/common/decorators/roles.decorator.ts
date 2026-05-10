import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@scrap-it/types";

export const ROLES_KEY = "scrap_it_roles";

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
