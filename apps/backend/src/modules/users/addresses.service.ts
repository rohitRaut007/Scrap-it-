import { Injectable, NotFoundException } from "@nestjs/common";
import { Address } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { AddressDto } from "./dto/address.dto";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<AddressDto[]> {
    const [user, rows] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { defaultAddressId: true },
      }),
      this.prisma.address.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const defaultId = user?.defaultAddressId ?? null;
    return rows.map((row) => toDto(row, defaultId));
  }

  async create(userId: string, dto: CreateAddressDto): Promise<AddressDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { defaultAddressId: true },
    });

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.address.create({
        data: {
          userId,
          label: dto.label ?? null,
          line1: dto.line1,
          line2: dto.line2 ?? null,
          city: dto.city,
          region: dto.region ?? null,
          postalCode: dto.postalCode ?? null,
          country: dto.country ?? "IN",
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
        },
      });

      const shouldBecomeDefault =
        dto.isDefault === true || user?.defaultAddressId == null;
      let defaultId = user?.defaultAddressId ?? null;

      if (shouldBecomeDefault) {
        await tx.user.update({
          where: { id: userId },
          data: { defaultAddressId: created.id },
        });
        defaultId = created.id;
      }

      return toDto(created, defaultId);
    });
  }

  async update(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<AddressDto> {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) {
      throw new NotFoundException("Address not found");
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.address.update({
        where: { id: addressId },
        data: {
          label: dto.label !== undefined ? dto.label ?? null : undefined,
          line1: dto.line1,
          line2: dto.line2 !== undefined ? dto.line2 ?? null : undefined,
          city: dto.city,
          region: dto.region !== undefined ? dto.region ?? null : undefined,
          postalCode:
            dto.postalCode !== undefined ? dto.postalCode ?? null : undefined,
          country: dto.country,
          latitude: dto.latitude !== undefined ? dto.latitude ?? null : undefined,
          longitude:
            dto.longitude !== undefined ? dto.longitude ?? null : undefined,
        },
      });

      let defaultId = (
        await tx.user.findUnique({
          where: { id: userId },
          select: { defaultAddressId: true },
        })
      )?.defaultAddressId ?? null;

      if (dto.isDefault === true && defaultId !== addressId) {
        await tx.user.update({
          where: { id: userId },
          data: { defaultAddressId: addressId },
        });
        defaultId = addressId;
      }

      return toDto(updated, defaultId);
    });
  }

  async remove(userId: string, addressId: string): Promise<void> {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) {
      throw new NotFoundException("Address not found");
    }
    // The User.defaultAddressId FK has onDelete: SetNull, so the default
    // pointer clears automatically when the row is removed.
    await this.prisma.address.delete({ where: { id: addressId } });
  }

  async setDefault(userId: string, addressId: string): Promise<AddressDto> {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) {
      throw new NotFoundException("Address not found");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { defaultAddressId: addressId },
    });

    return toDto(existing, addressId);
  }
}

function toDto(row: Address, defaultId: string | null): AddressDto {
  return {
    id: row.id,
    label: row.label,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    region: row.region,
    postalCode: row.postalCode,
    country: row.country,
    isDefault: row.id === defaultId,
  };
}
