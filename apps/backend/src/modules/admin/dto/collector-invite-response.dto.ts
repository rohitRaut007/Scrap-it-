import { CollectorAdminDto } from "./admin-order.dto";

export class CollectorInviteResponseDto {
  collector!: CollectorAdminDto;
  /** Shown once — never persisted in plaintext, never logged. */
  tempPassword!: string;
  isReactivation!: boolean;
}
