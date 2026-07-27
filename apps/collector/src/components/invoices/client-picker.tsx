"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client } from "@/lib/types";

export const NEW_CLIENT_VALUE = "__new__";

export function ClientPicker({
  clients,
  value,
  onChange,
  disabled,
}: {
  clients: Client[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("invoice");
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-10 w-full">
        <SelectValue placeholder={t("selectClientPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.entityName || c.siteName}
          </SelectItem>
        ))}
        <SelectItem value={NEW_CLIENT_VALUE}>{t("addNewClient")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
