"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { updateVersionAction } from "@/lib/admin-actions";
import type { Database } from "@/types/supabase";

type AppVersion = Database["public"]["Tables"]["app_versions"]["Row"];

const PLATFORM_LABEL: Record<string, string> = {
  ios: "iOS",
  android: "Android",
};

export function VersionForm({ version }: { version: AppVersion }) {
  const [minRequired, setMinRequired] = useState(version.min_required_version);
  const [latest, setLatest] = useState(version.latest_version);
  const [updateUrl, setUpdateUrl] = useState(version.update_url);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const platformLabel = PLATFORM_LABEL[version.platform] ?? version.platform;

  const isDirty =
    minRequired !== version.min_required_version ||
    latest !== version.latest_version ||
    updateUrl !== version.update_url;

  // Subir la mínima requerida es lo único acá que puede dejar afuera a TODOS
  // los usuarios de golpe; cambiar la última publicada o la URL, no. El
  // diálogo lo dice sólo cuando corresponde, para que la advertencia no se
  // vuelva ruido de fondo que se clickea sin leer.
  const raisesFloor = minRequired !== version.min_required_version;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setConfirmOpen(true);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await updateVersionAction({
        platform: version.platform,
        fields: {
          min_required_version: minRequired,
          latest_version: latest,
          update_url: updateUrl,
        },
      });

      if (result.ok) {
        setConfirmOpen(false);
        toast.success("Versiones actualizadas", { description: result.message });
      } else {
        toast.error("No se pudo guardar", { description: result.error });
      }
    });
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-neutral-outline-variant bg-surface-container p-5"
      >
        <h2 className="font-display text-lg uppercase text-neutral-on-surface">
          {platformLabel}
        </h2>

        <Field
          label="Versión mínima requerida"
          hint="Bloquea con un modal no descartable a cualquier versión por debajo de esta."
          value={minRequired}
          onChange={setMinRequired}
        />
        <Field
          label="Última versión publicada"
          hint="Informativa — dispara el aviso de 'hay una versión nueva', no bloquea por sí sola."
          value={latest}
          onChange={setLatest}
        />
        <Field
          label="URL de la tienda"
          hint="A dónde manda el botón Actualizar del modal."
          value={updateUrl}
          onChange={setUpdateUrl}
        />

        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Guardar
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`¿Actualizar versiones de ${platformLabel}?`}
        message={
          raisesFloor ? (
            <>
              La versión mínima requerida pasa de{" "}
              <strong className="text-neutral-on-surface">
                {version.min_required_version}
              </strong>{" "}
              a <strong className="text-neutral-on-surface">{minRequired}</strong>.
            </>
          ) : (
            "Se actualizan la última versión publicada y/o la URL de la tienda."
          )
        }
        impact={
          raisesFloor
            ? "Toda instalación por debajo de la nueva mínima queda bloqueada de inmediato con un modal que no se puede descartar, sin deploy de por medio."
            : undefined
        }
        confirmLabel="Guardar"
        tone={raisesFloor ? "danger" : "primary"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
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
