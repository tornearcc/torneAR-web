"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveSocialSnapshotAction } from "@/lib/social-actions";
import { PLATFORM_LABELS, type SocialPlatform } from "@/lib/social-platforms";
import { todayUTC } from "@/lib/date-range";
import type { Database } from "@/types/supabase";

type SocialAccountRow = Database["public"]["Tables"]["social_accounts"]["Row"];

interface MetricField {
  key:
    | "followers"
    | "following"
    | "posts"
    | "reach"
    | "views"
    | "profileViews"
    | "engagements";
  label: string;
}

const METRIC_FIELDS: readonly MetricField[] = [
  { key: "followers", label: "Seguidores" },
  { key: "following", label: "Siguiendo" },
  { key: "posts", label: "Publicaciones" },
  { key: "reach", label: "Alcance" },
  { key: "views", label: "Vistas" },
  { key: "profileViews", label: "Visitas al perfil" },
  { key: "engagements", label: "Interacciones" },
];

type FieldValues = Record<MetricField["key"], string>;

const EMPTY_FIELDS: FieldValues = {
  followers: "",
  following: "",
  posts: "",
  reach: "",
  views: "",
  profileViews: "",
  engagements: "",
};

/**
 * Carga manual del snapshot semanal (Fase 1 de Marketing & Growth).
 *
 * Todos los campos numéricos son opcionales a propósito: no todas las
 * plataformas exponen las mismas métricas (X no tiene "visitas al perfil"),
 * y forzar a tipear un 0 en lo que no se tiene sería guardar un dato falso
 * en vez de "no disponible".
 */
export function SocialSnapshotForm({
  accounts,
  defaultPlatform,
}: {
  accounts: SocialAccountRow[];
  defaultPlatform: SocialPlatform;
}) {
  const defaultAccount =
    accounts.find((a) => a.platform === defaultPlatform && a.is_active) ??
    accounts.find((a) => a.platform === defaultPlatform) ??
    accounts[0];

  const [accountId, setAccountId] = useState(defaultAccount?.id ?? "");
  const [capturedAt, setCapturedAt] = useState(todayUTC());
  const [fields, setFields] = useState<FieldValues>(EMPTY_FIELDS);
  const [isPending, startTransition] = useTransition();

  if (accounts.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-outline-variant bg-surface-container p-5 text-sm text-neutral-on-surface-variant">
        No hay cuentas sociales configuradas. Se cargan por SQL en{" "}
        <span className="font-mono">social_accounts</span>.
      </p>
    );
  }

  function updateField(key: MetricField["key"], value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    startTransition(async () => {
      const result = await saveSocialSnapshotAction({
        accountId,
        capturedAt,
        ...fields,
      });

      if (result.ok) {
        toast.success("Snapshot guardado", { description: result.message });
        setFields(EMPTY_FIELDS);
      } else {
        toast.error("No se pudo guardar", { description: result.error });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-neutral-outline-variant bg-surface-container p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-neutral-on-surface-variant">Cuenta</span>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="w-full bg-surface-low">
              <SelectValue placeholder="Elegí una cuenta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {PLATFORM_LABELS[account.platform as SocialPlatform] ?? account.platform} · @
                  {account.handle}
                  {!account.is_active ? " (inactiva)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-neutral-on-surface-variant">Fecha</span>
          <input
            type="date"
            value={capturedAt}
            max={todayUTC()}
            onChange={(e) => setCapturedAt(e.target.value)}
            className="rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-1.5 text-sm text-neutral-on-surface outline-none focus:border-brand-primary"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {METRIC_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            <span className="text-xs text-neutral-on-surface-variant">{field.label}</span>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="—"
              value={fields[field.key]}
              onChange={(e) => updateField(field.key, e.target.value)}
              className="rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-1.5 text-sm text-neutral-on-surface outline-none placeholder:text-neutral-outline focus:border-brand-primary"
            />
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-on-surface-variant">
          Dejá en blanco lo que esta red no mida — no se guarda como 0.
        </p>
        <Button type="submit" disabled={isPending || !accountId}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Guardar snapshot
        </Button>
      </div>
    </form>
  );
}
