import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import type { Address } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../database/prisma.service";
import { UpdateMeDto } from "./dto/update-me.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { AuthUser } from "./strategies/supabase-jwt.strategy";

function toDefaultAddress(a: Address) {
  return {
    id: a.id,
    label: a.label,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    region: a.region,
    postalCode: a.postalCode,
    country: a.country,
    isDefault: true,
  };
}

@Controller("auth")
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  private async buildMeResponse(authUser: AuthUser) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: authUser.id },
      include: { defaultAddress: true },
    });

    if (!dbUser) {
      return {
        user: {
          id: authUser.id,
          email: authUser.email,
          name: null as string | null,
          phone: null as string | null,
          role: authUser.role,
          defaultAddress: null,
        },
      };
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        phone: dbUser.phone,
        role: dbUser.role,
        defaultAddress: dbUser.defaultAddress
          ? toDefaultAddress(dbUser.defaultAddress)
          : null,
      },
    };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() authUser: AuthUser | undefined) {
    if (!authUser) {
      return { user: undefined };
    }
    return this.buildMeResponse(authUser);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async patchMe(
    @CurrentUser() authUser: AuthUser | undefined,
    @Body() dto: UpdateMeDto,
  ) {
    if (!authUser) {
      return { user: undefined };
    }

    const data: { name?: string | null; phone?: string | null } = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim() === "" ? null : dto.name.trim();
    }
    if (dto.phone !== undefined) {
      data.phone = dto.phone.trim() === "" ? null : dto.phone.trim();
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.user.update({
        where: { id: authUser.id },
        data,
      });
    }

    return this.buildMeResponse(authUser);
  }
}
