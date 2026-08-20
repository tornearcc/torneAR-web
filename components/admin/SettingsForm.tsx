"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { updateSettingAction } from "@/lib/admin-actions";
import type { Database } from "@/types/supabase";

type AppSetting = Database["public"]["Tables"]["app_settings"]["Row"];

export function SettingsForm({ settings }: { settings: AppSetting[] }) {
  if (settings.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-outline-variant bg-surface-container p-8 text-center text-neutral-on-surface-variant">
        No hay parámetros configurados.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {settings.map((setting) => (
        <SettingRow key={setting.key} setting={setting} />
      ))}
    </div>
  );
}

function SettingRow({ setting }: { setting: AppSetting }) {
  const [value, setValue] = useState(String(setting.value));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDirty = value !== String(setting.value);
  const numericValue = Number(value);
  const isValid = value.trim() !== "" && Number.isFinite(numericValue);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid) {
      toast.error("Valor inválido", { description: "Tiene que ser un número." });
      return;
    }
    setConfirmOpen(true);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await updateSettingAction({ key: setting.key, value: numericValue });

      if (result.ok) {
        setConfirmOpen(false);
        toast.success("Configuración actualizada", { description: result.message });
      } else {
        toast.error("No se pudo guardar", { description: result.error });
      }
    });
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-lg border border-neutral-outline-variant bg-surface-container p-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex-1">
          <label
            htmlFor={`setting-${setting.key}`}
            className="font-mono text-sm font-medium text-neutral-on-surface"
          >
            {setting.key}
          </label>
          {setting.description ? (
            <p className="mt-0.5 text-sm text-neutral-on-surface-variant">
              {setting.description}
            </p>
          ) : null}
          <input
            id={`setting-${setting.key}`}
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 w-40 rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-1.5 text-sm text-neutral-on-surface outline-none focus:border-brand-primary"
          />
        </div>

        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Guardar
        </Button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Actualizar el parámetro?"
        message={
          <>
            <span className="font-mono text-neutral-on-surface">{setting.key}</span> pasa de{" "}
            <strong className="text-neutral-on-surface">{String(setting.value)}</strong> a{" "}
            <strong className="text-neutral-on-surface">{numericValue}</strong>.
          </>
        }
        impact="Los parámetros operativos cambian el comportamiento de la app en producción de inmediato, sin deploy y sin necesidad de que nadie actualice."
        confirmLabel="Guardar"
        tone="danger"
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
