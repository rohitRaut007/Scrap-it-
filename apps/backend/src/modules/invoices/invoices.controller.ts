import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthUser } from "../auth/strategies/supabase-jwt.strategy";
import { InvoicesService } from "./invoices.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { UpdateInvoiceStatusDto } from "./dto/update-invoice-status.dto";
import { InvoicesQueryDto } from "./dto/invoices-query.dto";

@Controller("invoices")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("collector")
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get("clients")
  listClients(@CurrentUser() user: AuthUser) {
    return this.invoices.listClients(user);
  }

  @Post("clients")
  createClient(@CurrentUser() user: AuthUser, @Body() dto: CreateClientDto) {
    return this.invoices.createClient(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: InvoicesQueryDto) {
    return this.invoices.listInvoices(user, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.invoices.createInvoice(user, dto);
  }

  @Get(":id")
  get(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invoices.getInvoice(user, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoices.updateInvoice(user, id, dto);
  }

  @Post(":id/generate")
  generate(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invoices.generateInvoice(user, id);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.invoices.updateStatus(user, id, dto);
  }
}
