import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthUser } from "../auth/strategies/supabase-jwt.strategy";
import { AddressesService } from "./addresses.service";
import {
  AddressListResponse,
  AddressResponse,
} from "./dto/address.dto";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";

@Controller("me/addresses")
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthUser | undefined,
  ): Promise<AddressListResponse> {
    if (!user) throw new UnauthorizedException();
    const data = await this.addresses.list(user.id);
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressResponse> {
    if (!user) throw new UnauthorizedException();
    const data = await this.addresses.create(user.id, dto);
    return { data };
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: AuthUser | undefined,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressResponse> {
    if (!user) throw new UnauthorizedException();
    const data = await this.addresses.update(user.id, id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser | undefined,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ): Promise<void> {
    if (!user) throw new UnauthorizedException();
    await this.addresses.remove(user.id, id);
  }

  @Post(":id/default")
  async setDefault(
    @CurrentUser() user: AuthUser | undefined,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ): Promise<AddressResponse> {
    if (!user) throw new UnauthorizedException();
    const data = await this.addresses.setDefault(user.id, id);
    return { data };
  }
}
