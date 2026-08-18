"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

type Status = "idle" | "saving" | "success" | "error";

function SettingRow({ setting }: { setting: AppSetting }) {
  const router = useRouter();
  const [value, setValue] = useState(String(setting.value));
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDirty = value !== String(setting.value);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      setStatus("error");
      setErrorMessage("Tiene que ser un número.");
      return;
    }

    // Afecta producción en vivo sin deploy — confirmación explícita antes
    // de mandar el PATCH (§6 Hito 6 de WEB_SPECIFICATION.md).
    if (
      !window.confirm(
        `¿Confirmás actualizar "${setting.key}" a ${numericValue}? Este cambio afecta la app en producción de inmediato.`
      )
    ) {
      return;
    }

    setStatus("saving");
    setErrorMessage(null);

    const res = await fetch(`/api/admin/settings/${setting.key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: numericValue }),
    });

    if (!res.ok) {
      const body: { error?: string } | null = await res.json().catch(() => null);
      setStatus("error");
      setErrorMessage(body?.error ?? "No se pudo guardar.");
      return;
    }

    setStatus("success");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-neutral-outline-variant bg-surface-container p-5 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="flex-1">
        <label htmlFor={`setting-${setting.key}`} className="text-sm font-medium text-neutral-on-surface">
          {setting.key}
        </label>
        {setting.description && (
          <p className="mt-0.5 text-sm text-neutral-on-surface-variant">{setting.description}</p>
        )}
        <input
          id={`setting-${setting.key}`}
          type="number"
          step="any"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus("idle");
          }}
          className="mt-2 w-40 rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-1.5 text-sm text-neutral-on-surface outline-none focus:border-brand-primary"
        />
      </div>

      <div className="flex items-center gap-3">
        {status === "error" && <p className="text-sm text-danger-error">{errorMessage}</p>}
        {status === "success" && !isDirty && (
          <p className="text-sm text-brand-primary">Guardado.</p>
        )}
        <button
          type="submit"
          disabled={status === "saving" || !isDirty}
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-inverse-primary transition hover:bg-brand-primary-container disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "saving" ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
