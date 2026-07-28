"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  COMMERCIAL_CLIENT_TYPES,
  resolveBillType,
  DEFAULT_ITEM_DESCRIPTION,
  DEFAULT_ITEM_UNIT,
  DEFAULT_PREMISES_TYPE,
  type BillType,
  type ClientType,
} from "@scrap-it/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPicker, NEW_CLIENT_VALUE } from "@/components/invoices/client-picker";
import { useClients, useInvoice, useProfile } from "@/hooks/use-portal";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { collectorApi, ApiError } from "@/lib/api";
import { revalidateCollectorData } from "@/lib/revalidate";
import { currentBillingPeriod, monthMessageKey, nextBillingPeriod } from "@/lib/invoice-utils";
import { invoiceToPreviewInput } from "@/lib/invoice-preview-input";
import type { InvoicePreviewInput } from "@/components/invoices/invoice-preview";

const InvoicePreview = dynamic(
  () => import("@/components/invoices/invoice-preview").then((m) => m.InvoicePreview),
  { ssr: false, loading: () => <PreviewSkeleton /> },
);
const InvoiceShareButton = dynamic(
  () => import("@/components/invoices/invoice-share-button").then((m) => m.InvoiceShareButton),
  { ssr: false },
);

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const STEPS = ["billType", "client", "details", "review"] as const;
type Step = (typeof STEPS)[number];

const CLIENT_TYPE_MESSAGE_KEY: Record<ClientType, string> = {
  SOCIETY: "clientType.society",
  CORPORATE: "clientType.corporate",
  RESTAURANT: "clientType.restaurant",
  FACTORY: "clientType.factory",
  OFFICE: "clientType.office",
  PROCESSOR: "clientType.processor",
};

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <NewInvoiceContent />
    </Suspense>
  );
}

function NewInvoiceContent() {
  const router = useRouter();
  const t = useTranslations("invoice");
  const tMonth = useTranslations("invoice.month");
  const searchParams = useSearchParams();
  const cloneFromId = searchParams.get("cloneFrom");

  const { data: profile } = useProfile();
  const { data: clients, error: clientsError } = useClients();
  const { data: cloneSource, error: cloneError } = useInvoice(cloneFromId);

  const [step, setStep] = useState<Step>("billType");
  const [userInteracted, setUserInteracted] = useState(false);
  const [billType, setBillType] = useState<BillType | null>(null);

  const [clientId, setClientId] = useState("");
  const [copyFromClientId, setCopyFromClientId] = useState("");
  const [newClient, setNewClient] = useState({
    type: "CORPORATE" as ClientType,
    entityName: "",
    siteName: "",
    premisesType: "",
    premisesTypeTouched: false,
    gstin: "",
    addressText: "",
    billToAddressText: "",
    contactName: "",
    phone: "",
  });

  const [period, setPeriod] = useState(currentBillingPeriod());
  const [descriptionCustom, setDescriptionCustom] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const [payableTo, setPayableTo] = useState("");
  const [referencePoNumber, setReferencePoNumber] = useState("");
  const [termsOfPayment, setTermsOfPayment] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // The clone-from-invoice fetch is an explicitly user-invoked action (via a
  // link) — a failure there shouldn't fail silently.
  useEffect(() => {
    if (cloneFromId && cloneError) {
      toast.error(t("cloneLoadError"));
    }
  }, [cloneFromId, cloneError, t]);

  // Default payableTo from the collector's saved profile, once, unless cloning.
  useEffect(() => {
    if (profile && !cloneFromId && !payableTo) {
      setPayableTo(profile.payableTo ?? "");
    }
  }, [profile, cloneFromId, payableTo]);

  // Default the description/unit preset whenever the bill type is (re)selected,
  // unless the collector already customized it.
  useEffect(() => {
    if (billType && !descriptionCustom) {
      setDescription(DEFAULT_ITEM_DESCRIPTION[billType]);
    }
  }, [billType, descriptionCustom]);

  useEffect(() => {
    if (billType === "COMMERCIAL" && !termsOfPayment) {
      setTermsOfPayment(t("termsOfPaymentDefault"));
    }
  }, [billType, termsOfPayment, t]);

  useEffect(() => {
    if (billType === "COMMERCIAL" && !termsAndConditions && profile !== undefined) {
      setTermsAndConditions(
        profile?.defaultTermsAndConditions ||
          [
            t("termsAndConditionsDefaultLine1"),
            t("termsAndConditionsDefaultLine2"),
            t("termsAndConditionsDefaultLine3"),
          ].join("\n"),
      );
    }
  }, [billType, termsAndConditions, profile, t]);

  // "Generate next month" — clone everything from the source invoice, and
  // skip straight to the Details step since bill type + client are already
  // fixed. Skipped once the user has manually navigated the wizard, so a
  // slow-resolving clone fetch can't yank them out of a step they've
  // already started filling in.
  useEffect(() => {
    if (cloneSource && !prefilled && !userInteracted) {
      setBillType(cloneSource.billType);
      setClientId(cloneSource.client.id);
      setPeriod(nextBillingPeriod(cloneSource.billingMonth, cloneSource.billingYear));
      setPayableTo(cloneSource.payableTo ?? profile?.payableTo ?? "");
      const firstItem = cloneSource.items[0];
      if (firstItem) {
        setDescription(firstItem.description);
        setDescriptionCustom(firstItem.description !== DEFAULT_ITEM_DESCRIPTION[cloneSource.billType]);
        setQuantity(String(firstItem.quantity));
        setRate(String(firstItem.rate));
      }
      setReferencePoNumber(cloneSource.referencePoNumber ?? "");
      setTermsOfPayment(cloneSource.termsOfPayment ?? "");
      setTermsAndConditions(cloneSource.termsAndConditions ?? "");
      setPrefilled(true);
      setStep("details");
    }
  }, [cloneSource, prefilled, profile, userInteracted]);

  const filteredClients = useMemo(
    () => (clients ?? []).filter((c) => !billType || resolveBillType(c.type) === billType),
    [clients, billType],
  );
  const otherClients = useMemo(
    () => (clients ?? []).filter((c) => c.id !== clientId),
    [clients, clientId],
  );

  const selectedClient = filteredClients.find((c) => c.id === clientId);
  const isNewClient = clientId === NEW_CLIENT_VALUE;
  const isCommercial = billType === "COMMERCIAL";

  const parsedQuantity = isCommercial ? 1 : Number(quantity) || 0;
  const parsedRate = Number(rate) || 0;
  const resolvedUnit = billType ? DEFAULT_ITEM_UNIT[billType] : "Units";

  const clientStepValid = isNewClient
    ? newClient.entityName.trim().length > 0 &&
      newClient.siteName.trim().length > 0 &&
      newClient.addressText.trim().length > 0
    : Boolean(clientId);
  const detailsStepValid =
    description.trim().length > 0 &&
    parsedQuantity > 0 &&
    parsedQuantity <= 1_000_000 &&
    parsedRate > 0 &&
    parsedRate <= 10_000_000;

  const previewInput: InvoicePreviewInput | null = useMemo(() => {
    if (!billType) return null;
    const base = {
      businessName: profile?.shopName || profile?.name || t("yourBusinessPlaceholder"),
      businessTagline: profile?.businessTagline ?? null,
      accentColor: profile?.accentColor ?? null,
      mobNo: profile?.phone ?? null,
      billingMonth: period.month,
      billingYear: period.year,
      billNumber: null,
      entityName: isNewClient ? newClient.entityName || null : selectedClient?.entityName ?? null,
      siteName: isNewClient ? newClient.siteName || t("siteNamePlaceholder") : selectedClient?.siteName ?? t("siteNamePlaceholder"),
      premisesType: isNewClient ? newClient.premisesType || null : selectedClient?.premisesType ?? null,
      addressText: isNewClient ? newClient.addressText || null : selectedClient?.addressText ?? null,
      billToAddressText: isNewClient ? newClient.billToAddressText || null : selectedClient?.billToAddressText ?? null,
      gstin: isNewClient ? newClient.gstin || null : selectedClient?.gstin ?? null,
      items: [{ description, quantity: parsedQuantity, unit: resolvedUnit, rate: parsedRate }],
      payableTo: payableTo.trim() || null,
    };
    if (billType === "RESIDENTIAL") {
      return { billType: "RESIDENTIAL", ...base };
    }
    return {
      billType: "COMMERCIAL",
      ...base,
      referencePoNumber: referencePoNumber.trim() || null,
      termsOfPayment: termsOfPayment.trim() || null,
      termsAndConditions: termsAndConditions.trim() || null,
    };
  }, [
    billType, profile, t, period, isNewClient, newClient, selectedClient,
    description, parsedQuantity, resolvedUnit, parsedRate, payableTo,
    referencePoNumber, termsOfPayment, termsAndConditions,
  ]);
  const debouncedPreviewInput = useDebouncedValue(previewInput, 350);

  const applyCopyFrom = (id: string) => {
    setCopyFromClientId(id);
    const source = (clients ?? []).find((c) => c.id === id);
    if (!source) return;
    setNewClient((c) => ({
      ...c,
      siteName: source.siteName,
      addressText: source.addressText ?? "",
      billToAddressText: source.billToAddressText ?? "",
      gstin: source.gstin ?? "",
    }));
  };

  const goNext = () => {
    setUserInteracted(true);
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };
  const goBack = () => {
    setUserInteracted(true);
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleGenerate = async () => {
    if (!billType || !detailsStepValid) return;
    setSubmitting(true);
    try {
      let resolvedClientId = clientId;
      if (isNewClient) {
        const created = await collectorApi.createClient({
          type: newClient.type,
          siteName: newClient.siteName.trim(),
          entityName: newClient.entityName.trim() || undefined,
          premisesType: newClient.premisesType.trim() || undefined,
          gstin: newClient.gstin.trim() || undefined,
          addressText: newClient.addressText.trim() || undefined,
          billToAddressText: newClient.billToAddressText.trim() || undefined,
          contactName: newClient.contactName.trim() || undefined,
          phone: newClient.phone.trim() || undefined,
        });
        resolvedClientId = created.id;
        // Persist immediately: if createInvoice below fails and the user
        // retries, this stops a second client record from being created.
        setClientId(created.id);
      }

      const invoice = await collectorApi.createInvoice({
        clientId: resolvedClientId,
        billingMonth: period.month,
        billingYear: period.year,
        payableTo: payableTo.trim() || undefined,
        referencePoNumber: isCommercial ? referencePoNumber.trim() || undefined : undefined,
        termsOfPayment: isCommercial ? termsOfPayment.trim() || undefined : undefined,
        termsAndConditions: isCommercial ? termsAndConditions.trim() || undefined : undefined,
        items: [{ description, quantity: parsedQuantity, unit: resolvedUnit, rate: parsedRate }],
      });
      const generated = await collectorApi.generateInvoice(invoice.id);
      await revalidateCollectorData("invoices");
      setGeneratedId(generated.id);
      toast.success(t("toastGenerated"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("toastError"));
    } finally {
      setSubmitting(false);
    }
  };

  const { data: generatedInvoice } = useInvoice(generatedId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("newInvoice")}</h1>

      <StepProgress current={step} />

      {step === "billType" && (
        <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-3">
          <h2 className="text-sm font-semibold">{t("stepBillType")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <BillTypeTile
              selected={billType === "RESIDENTIAL"}
              label={t("billTypeResidential")}
              onClick={() => setBillType("RESIDENTIAL")}
            />
            <BillTypeTile
              selected={billType === "COMMERCIAL"}
              label={t("billTypeCommercial")}
              onClick={() => setBillType("COMMERCIAL")}
            />
          </div>
          <Button className="w-full" size="lg" disabled={!billType} onClick={goNext}>
            {t("continue")}
          </Button>
        </div>
      )}

      {step === "client" && billType && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-3.5">
            <h2 className="text-sm font-semibold">{t("clientSectionTitle")}</h2>
            {clientsError && (
              <p className="text-xs text-destructive">{t("clientsLoadError")}</p>
            )}
            <ClientPicker
              clients={filteredClients}
              value={clientId}
              onChange={setClientId}
              disabled={submitting}
            />
            {isNewClient && (
              <div className="space-y-3 rounded-xl border border-dashed p-3">
                {otherClients.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>{t("copyFromExistingClientLabel")}</Label>
                    <Select value={copyFromClientId || undefined} onValueChange={applyCopyFrom}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder={t("copyFromExistingClientPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {otherClients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.entityName || c.siteName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Field
                  id="entityName"
                  label={t("entityNameLabel")}
                  value={newClient.entityName}
                  onChange={(v) => setNewClient((c) => ({ ...c, entityName: v }))}
                  placeholder={t("entityNamePlaceholder")}
                  disabled={submitting}
                  maxLength={160}
                />
                <Field
                  id="siteName"
                  label={t("siteNameLabel")}
                  value={newClient.siteName}
                  onChange={(v) => setNewClient((c) => ({ ...c, siteName: v }))}
                  disabled={submitting}
                  maxLength={160}
                />
                {isCommercial && (
                  <div className="space-y-1.5">
                    <Label>{t("clientTypeLabel")}</Label>
                    <Select
                      value={newClient.type}
                      onValueChange={(v) =>
                        setNewClient((c) => ({
                          ...c,
                          type: v as ClientType,
                          premisesType: c.premisesTypeTouched
                            ? c.premisesType
                            : DEFAULT_PREMISES_TYPE[v as ClientType],
                        }))
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMERCIAL_CLIENT_TYPES.map((ct) => (
                          <SelectItem key={ct} value={ct}>
                            {t(CLIENT_TYPE_MESSAGE_KEY[ct])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Field
                  id="premisesType"
                  label={t("premisesTypeLabel")}
                  value={newClient.premisesType || DEFAULT_PREMISES_TYPE[newClient.type]}
                  onChange={(v) =>
                    setNewClient((c) => ({ ...c, premisesType: v, premisesTypeTouched: true }))
                  }
                  disabled={submitting}
                  maxLength={60}
                />
                <Field
                  id="gstin"
                  label={t("gstinLabel")}
                  value={newClient.gstin}
                  onChange={(v) => setNewClient((c) => ({ ...c, gstin: v }))}
                  placeholder={t("gstinPlaceholder")}
                  disabled={submitting}
                  maxLength={15}
                />
                <Field
                  id="clientAddress"
                  label={t("addressFieldLabel")}
                  value={newClient.addressText}
                  onChange={(v) => setNewClient((c) => ({ ...c, addressText: v }))}
                  disabled={submitting}
                  maxLength={300}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2.5">
            <Button variant="outline" className="flex-1" onClick={goBack}>
              {t("back")}
            </Button>
            <Button className="flex-1" disabled={!clientStepValid} onClick={goNext}>
              {t("continue")}
            </Button>
          </div>
        </div>
      )}

      {step === "details" && billType && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-3.5">
            <h2 className="text-sm font-semibold">{t("periodSectionTitle")}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("billingMonthLabel")}</Label>
                <Select
                  value={String(period.month)}
                  onValueChange={(v) => setPeriod((p) => ({ ...p, month: Number(v) }))}
                  disabled={submitting}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {tMonth(monthMessageKey(m))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field
                id="billingYear"
                label={t("billingYearLabel")}
                value={String(period.year)}
                onChange={(v) => setPeriod((p) => ({ ...p, year: Number(v) || p.year }))}
                disabled={submitting}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-3">
            <h2 className="text-sm font-semibold">{t("itemsSectionTitle")}</h2>
            <div className="space-y-1.5">
              <Label>{t("itemDescriptionLabel")}</Label>
              {descriptionCustom ? (
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  maxLength={200}
                  className="h-10"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setDescriptionCustom(true)}
                  className="flex w-full items-center justify-between rounded-md border border-dashed px-3 py-2 text-left text-sm"
                  disabled={submitting}
                >
                  <span>{description}</span>
                  <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className={`grid gap-2 ${isCommercial ? "grid-cols-1" : "grid-cols-2"}`}>
              {!isCommercial && (
                <Field
                  id="quantity"
                  label={t("itemQtyPlaceholder")}
                  value={quantity}
                  onChange={setQuantity}
                  inputMode="decimal"
                  disabled={submitting}
                />
              )}
              <Field
                id="rate"
                label={t("itemRatePlaceholder")}
                value={rate}
                onChange={setRate}
                inputMode="decimal"
                disabled={submitting}
              />
            </div>
            <Field
              id="payableTo"
              label={t("payableToLabel")}
              value={payableTo}
              onChange={setPayableTo}
              placeholder={t("payableToPlaceholder")}
              disabled={submitting}
              maxLength={120}
            />
          </div>

          {isCommercial && (
            <div className="rounded-2xl border bg-card p-4 shadow-xs">
              <button
                type="button"
                className="flex w-full items-center justify-between text-sm font-semibold"
                onClick={() => setAdvancedOpen((v) => !v)}
              >
                {t("advancedOptionalLabel")}
                <span className="text-xs text-muted-foreground">
                  {advancedOpen ? "−" : "+"}
                </span>
              </button>
              {advancedOpen && (
                <div className="mt-3 space-y-3">
                  <Field
                    id="referencePoNumber"
                    label={t("referencePoNumberLabel")}
                    value={referencePoNumber}
                    onChange={setReferencePoNumber}
                    placeholder={t("referencePoNumberPlaceholder")}
                    disabled={submitting}
                    maxLength={60}
                  />
                  <Field
                    id="termsOfPayment"
                    label={t("termsOfPaymentLabel")}
                    value={termsOfPayment}
                    onChange={setTermsOfPayment}
                    disabled={submitting}
                    maxLength={120}
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="termsAndConditions">{t("termsAndConditionsLabel")}</Label>
                    <Textarea
                      id="termsAndConditions"
                      value={termsAndConditions}
                      onChange={(e) => setTermsAndConditions(e.target.value)}
                      disabled={submitting}
                      maxLength={1000}
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2.5">
            <Button variant="outline" className="flex-1" onClick={goBack}>
              {t("back")}
            </Button>
            <Button className="flex-1" disabled={!detailsStepValid} onClick={goNext}>
              {t("continue")}
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          {!generatedId ? (
            <>
              <div className="h-[70vh] min-h-[480px] w-full rounded-xl border overflow-hidden">
                {debouncedPreviewInput && <InvoicePreview data={debouncedPreviewInput} />}
              </div>
              <div className="flex gap-2.5">
                <Button variant="outline" className="flex-1" onClick={goBack} disabled={submitting}>
                  {t("back")}
                </Button>
                <Button className="flex-1" size="lg" onClick={handleGenerate} disabled={submitting}>
                  {submitting ? t("generating") : t("generateInvoice")}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">{t("generateHint")}</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 text-sm font-medium text-cash shadow-xs">
                <Check className="h-4 w-4 shrink-0" />
                {t("toastGenerated")}
              </div>
              <div className="h-[70vh] min-h-[480px] w-full rounded-xl border overflow-hidden">
                {generatedInvoice && (
                  <InvoicePreview data={invoiceToPreviewInput(generatedInvoice, profile)} />
                )}
              </div>
              {profile && generatedInvoice && (
                <InvoiceShareButton invoice={generatedInvoice} profile={profile} />
              )}
              <Button variant="outline" className="w-full" onClick={() => router.push(`/invoices/${generatedId}`)}>
                {t("backToInvoices")}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StepProgress({ current }: { current: Step }) {
  const t = useTranslations("invoice");
  const idx = STEPS.indexOf(current);
  const labels: Record<Step, string> = {
    billType: t("stepBillType"),
    client: t("stepClient"),
    details: t("stepDetails"),
    review: t("stepReview"),
  };
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-1.5">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}
          </div>
          <span className={`hidden text-xs sm:inline ${i === idx ? "font-semibold" : "text-muted-foreground"}`}>
            {labels[s]}
          </span>
          {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < idx ? "bg-primary" : "bg-muted"}`} />}
        </div>
      ))}
    </div>
  );
}

function BillTypeTile({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-center text-sm font-semibold transition-colors ${
        selected ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function PreviewSkeleton() {
  return <Skeleton className="h-full rounded-xl" />;
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: "tel" | "numeric" | "decimal";
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        maxLength={maxLength}
        className="h-10"
      />
    </div>
  );
}
