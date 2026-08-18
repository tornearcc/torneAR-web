"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Database } from "@/types/supabase";

type AppVersion = Database["public"]["Tables"]["app_versions"]["Row"];

const PLATFORM_LABEL: Record<string, string> = {
  ios: "iOS",
  android: "Android",
};

type Status = "idle" | "saving" | "success" | "error";

export function VersionForm({ version }: { version: AppVersion }) {
  const router = useRouter();
  const [minRequired, setMinRequired] = useState(version.min_required_version);
  const [latest, setLatest] = useState(version.latest_version);
  const [updateUrl, setUpdateUrl] = useState(version.update_url);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDirty =
    minRequired !== version.min_required_version ||
    latest !== version.latest_version ||
    updateUrl !== version.update_url;

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setStatus("idle");
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // `min_required_version` puede dejar afuera a TODOS los usuarios de
    // una sola vez (ver 20260804122000_app_versions_force_update.sql) —
    // confirmación explícita antes de mandar el PATCH, mismo criterio que
    // SettingsForm (§6 Hito 6 de WEB_SPECIFICATION.md).
    if (
      !window.confirm(
        `¿Confirmás actualizar la versión de ${PLATFORM_LABEL[version.platform] ?? version.platform}? Si subiste la versión mínima requerida, las versiones anteriores quedan bloqueadas de inmediato.`
      )
    ) {
      return;
    }

    setStatus("saving");
    setErrorMessage(null);

    const res = await fetch(`/api/admin/versions/${version.platform}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        min_required_version: minRequired,
        latest_version: latest,
        update_url: updateUrl,
      }),
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
      className="flex flex-col gap-4 rounded-lg border border-neutral-outline-variant bg-surface-container p-5"
    >
      <h2 className="font-display text-lg uppercase text-neutral-on-surface">
        {PLATFORM_LABEL[version.platform] ?? version.platform}
      </h2>

      <Field
        label="Versión mínima requerida"
        hint="Bloquea con un modal no descartable a cualquier versión por debajo de esta."
        value={minRequired}
        onChange={markDirty(setMinRequired)}
      />
      <Field
        label="Última versión publicada"
        hint="Informativa — dispara el aviso de 'hay una versión nueva', no bloquea por sí sola."
        value={latest}
        onChange={markDirty(setLatest)}
      />
      <Field
        label="URL de la tienda"
        hint="A dónde manda el botón Actualizar del modal."
        value={updateUrl}
        onChange={markDirty(setUpdateUrl)}
      />

      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          {status === "error" && <p className="text-sm text-danger-error">{errorMessage}</p>}
          {status === "success" && !isDirty && (
            <p className="text-sm text-brand-primary">Guardado.</p>
          )}
        </div>
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

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-on-surface">{label}</label>
      <p className="mt-0.5 text-xs text-neutral-on-surface-variant">{hint}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-1.5 text-sm text-neutral-on-surface outline-none focus:border-brand-primary"
      />
    </div>
  );
}
