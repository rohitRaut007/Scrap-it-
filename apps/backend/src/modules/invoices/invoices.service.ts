import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Client, Invoice, InvoiceItem, InvoiceStatus, Prisma } from "@prisma/client";
import {
  numberToWordsInr,
  resolveBillType,
  formatBillNumber,
  DEFAULT_ITEM_DESCRIPTION,
  DEFAULT_ITEM_UNIT,
  DEFAULT_PREMISES_TYPE,
  type BillType,
} from "@scrap-it/constants";
import { PrismaService } from "../../database/prisma.service";
import { CollectorPortalService } from "../collectors/collector-portal.service";
import type { AuthUser } from "../auth/strategies/supabase-jwt.strategy";
import { CreateClientDto } from "./dto/create-client.dto";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { InvoiceItemInputDto } from "./dto/invoice-item.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { UpdateInvoiceStatusDto } from "./dto/update-invoice-status.dto";
import { InvoicesQueryDto } from "./dto/invoices-query.dto";
import {
  ClientDto,
  InvoiceDto,
  InvoiceListResponse,
} from "./dto/invoice.dto";

type InvoiceWithRelations = Invoice & { client: Client; items: InvoiceItem[] };

const INVOICE_INCLUDE = {
  client: true,
  items: true,
} satisfies Prisma.InvoiceInclude;

const FALLBACK_TERMS_AND_CONDITIONS = [
  "1. Payment due within 7 days of invoice date.",
  "2. Payable to the collector named above.",
  "3. Service subject to monthly renewal.",
].join("\n");

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly collectorPortal: CollectorPortalService,
  ) {}

  async listClients(authUser: AuthUser): Promise<ClientDto[]> {
    const collector = await this.collectorPortal.getOrCreateCollector(authUser);
    const clients = await this.prisma.client.findMany({
      where: { collectorId: collector.id },
      orderBy: { siteName: "asc" },
    });
    return clients.map((c) => this.toClientDto(c));
  }

  async createClient(authUser: AuthUser, dto: CreateClientDto): Promise<ClientDto> {
    const collector = await this.collectorPortal.getOrCreateCollector(authUser);
    const client = await this.prisma.client.create({
      data: {
        collectorId: collector.id,
        type: dto.type,
        siteName: dto.siteName.trim(),
        entityName: dto.entityName?.trim() || null,
        premisesType: dto.premisesType?.trim() || DEFAULT_PREMISES_TYPE[dto.type],
        gstin: dto.gstin?.trim() || null,
        contactName: dto.contactName?.trim() || null,
        phone: dto.phone?.trim() || null,
        addressText: dto.addressText?.trim() || null,
        billToAddressText: dto.billToAddressText?.trim() || null,
      },
    });
    return this.toClientDto(client);
  }

  async createInvoice(authUser: AuthUser, dto: CreateInvoiceDto): Promise<InvoiceDto> {
    const collector = await this.collectorPortal.getOrCreateCollector(authUser);
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) throw new NotFoundException("Client not found");
    if (client.collectorId !== collector.id) {
      throw new ForbiddenException("This client belongs to another collector");
    }

    const billType = resolveBillType(client.type);
    const items = dto.items.map((item) => this.toItemCreateInput(item, billType));
    const subtotal = round2(items.reduce((sum, item) => sum + item.amount, 0));

    const isCommercial = billType === "COMMERCIAL";
    const invoice = await this.prisma.invoice.create({
      data: {
        collectorId: collector.id,
        clientId: client.id,
        billType,
        billingMonth: dto.billingMonth,
        billingYear: dto.billingYear,
        payableTo: dto.payableTo?.trim() || collector.payableTo || null,
        referencePoNumber: isCommercial ? dto.referencePoNumber?.trim() || null : null,
        termsOfPayment: isCommercial
          ? dto.termsOfPayment?.trim() || "7 Days from Invoice"
          : null,
        termsAndConditions: isCommercial
          ? dto.termsAndConditions?.trim() ||
            collector.defaultTermsAndConditions ||
            FALLBACK_TERMS_AND_CONDITIONS
          : null,
        subtotal,
        total: subtotal,
        items: { create: items },
      },
      include: INVOICE_INCLUDE,
    });
    return this.toInvoiceDto(invoice);
  }

  async updateInvoice(
    authUser: AuthUser,
    id: string,
    dto: UpdateInvoiceDto,
  ): Promise<InvoiceDto> {
    const invoice = await this.getOwnedInvoice(authUser, id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException(
        "Only a draft invoice can be edited — generate a new invoice for corrections",
      );
    }

    const isCommercial = invoice.billType === "COMMERCIAL";
    const data: Prisma.InvoiceUpdateInput = {};
    if (dto.billingMonth !== undefined) data.billingMonth = dto.billingMonth;
    if (dto.billingYear !== undefined) data.billingYear = dto.billingYear;
    if (dto.payableTo !== undefined) {
      data.payableTo = dto.payableTo.trim() === "" ? null : dto.payableTo.trim();
    }
    if (isCommercial) {
      if (dto.referencePoNumber !== undefined) {
        data.referencePoNumber = dto.referencePoNumber.trim() || null;
      }
      if (dto.termsOfPayment !== undefined) {
        data.termsOfPayment = dto.termsOfPayment.trim() || null;
      }
      if (dto.termsAndConditions !== undefined) {
        data.termsAndConditions = dto.termsAndConditions.trim() || null;
      }
    }
    if (dto.items !== undefined) {
      const items = dto.items.map((item) =>
        this.toItemCreateInput(item, invoice.billType as BillType),
      );
      const subtotal = round2(items.reduce((sum, item) => sum + item.amount, 0));
      data.items = { deleteMany: {}, create: items };
      data.subtotal = subtotal;
      data.total = subtotal;
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data,
      include: INVOICE_INCLUDE,
    });
    return this.toInvoiceDto(updated);
  }

  async listInvoices(
    authUser: AuthUser,
    query: InvoicesQueryDto,
  ): Promise<InvoiceListResponse> {
    const collector = await this.collectorPortal.getOrCreateCollector(authUser);
    const where: Prisma.InvoiceWhereInput = { collectorId: collector.id };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        include: INVOICE_INCLUDE,
        orderBy: [
          { billingYear: "desc" },
          { billingMonth: "desc" },
          { createdAt: "desc" },
        ],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return {
      data: rows.map((r) => this.toInvoiceDto(r)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async getInvoice(authUser: AuthUser, id: string): Promise<InvoiceDto> {
    const invoice = await this.getOwnedInvoice(authUser, id);
    return this.toInvoiceDto(invoice);
  }

  /**
   * Assigns the sequential invoiceNumber (idempotent, same pattern as
   * getOrAssignOrderReceiptNumber), computes amountInWords, and flips
   * DRAFT -> SENT. Calling this again on an already-generated invoice is a
   * no-op that just returns it — generation never re-numbers or re-locks.
   * The counter incremented is picked by the invoice's own billType, so
   * RES-### and COM-### are independent sequences that never collide.
   */
  async generateInvoice(authUser: AuthUser, id: string): Promise<InvoiceDto> {
    const collector = await this.collectorPortal.getOrCreateCollector(authUser);

    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        select: { collectorId: true, billType: true, invoiceNumber: true, total: true },
      });
      if (!invoice) throw new NotFoundException("Invoice not found");
      if (invoice.collectorId !== collector.id) {
        throw new ForbiddenException("This invoice belongs to another collector");
      }
      if (invoice.invoiceNumber != null) return;

      const nextNumber =
        invoice.billType === "RESIDENTIAL"
          ? (
              await tx.collector.update({
                where: { id: collector.id },
                data: { residentialInvoiceSequence: { increment: 1 } },
                select: { residentialInvoiceSequence: true },
              })
            ).residentialInvoiceSequence
          : (
              await tx.collector.update({
                where: { id: collector.id },
                data: { commercialInvoiceSequence: { increment: 1 } },
                select: { commercialInvoiceSequence: true },
              })
            ).commercialInvoiceSequence;
      const claimed = await tx.invoice.updateMany({
        where: { id, invoiceNumber: null },
        data: {
          invoiceNumber: nextNumber,
          issuedAt: new Date(),
          status: InvoiceStatus.SENT,
          amountInWords: numberToWordsInr(invoice.total),
        },
      });
      if (claimed.count === 0) {
        // Lost a race to a concurrent generate call — the winner's number is
        // authoritative; the increment we spent just leaves a harmless gap.
        return;
      }
    });

    const invoice = await this.prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: INVOICE_INCLUDE,
    });
    return this.toInvoiceDto(invoice);
  }

  async updateStatus(
    authUser: AuthUser,
    id: string,
    dto: UpdateInvoiceStatusDto,
  ): Promise<InvoiceDto> {
    const invoice = await this.getOwnedInvoice(authUser, id);
    if (invoice.status === InvoiceStatus.DRAFT) {
      throw new ConflictException("Generate the invoice before changing its status");
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: dto.status as InvoiceStatus },
      include: INVOICE_INCLUDE,
    });
    return this.toInvoiceDto(updated);
  }

  private async getOwnedInvoice(
    authUser: AuthUser,
    id: string,
  ): Promise<InvoiceWithRelations> {
    const collector = await this.collectorPortal.getOrCreateCollector(authUser);
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.collectorId !== collector.id) {
      throw new ForbiddenException("This invoice belongs to another collector");
    }
    return invoice;
  }

  private toItemCreateInput(item: InvoiceItemInputDto, billType: BillType) {
    const description = item.description?.trim() || DEFAULT_ITEM_DESCRIPTION[billType];
    const unit = item.unit?.trim() || DEFAULT_ITEM_UNIT[billType];
    return {
      description,
      quantity: item.quantity,
      unit,
      rate: item.rate,
      amount: round2(item.quantity * item.rate),
    };
  }

  private toClientDto(client: Client): ClientDto {
    return {
      id: client.id,
      type: client.type as ClientDto["type"],
      siteName: client.siteName,
      entityName: client.entityName,
      premisesType: client.premisesType,
      gstin: client.gstin,
      contactName: client.contactName,
      phone: client.phone,
      addressText: client.addressText,
      billToAddressText: client.billToAddressText,
    };
  }

  private toInvoiceDto(invoice: InvoiceWithRelations): InvoiceDto {
    const billType = invoice.billType as BillType;
    return {
      id: invoice.id,
      billType,
      billNumber: formatBillNumber(billType, invoice.invoiceNumber),
      invoiceNumber: invoice.invoiceNumber,
      billingMonth: invoice.billingMonth,
      billingYear: invoice.billingYear,
      issuedAt: invoice.issuedAt?.toISOString() ?? null,
      status: invoice.status,
      payableTo: invoice.payableTo,
      referencePoNumber: invoice.referencePoNumber,
      termsOfPayment: invoice.termsOfPayment,
      termsAndConditions: invoice.termsAndConditions,
      subtotal: invoice.subtotal,
      total: invoice.total,
      amountInWords: invoice.amountInWords,
      createdAt: invoice.createdAt.toISOString(),
      client: this.toClientDto(invoice.client),
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: item.amount,
      })),
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
