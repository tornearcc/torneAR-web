"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getProfileGenderAction,
  setProfileGenderAction,
  type ProfileGender,
} from "@/lib/admin-actions";
import { cn } from "@/lib/utils";
import type { AdminUserRow } from "@/lib/users-data";

const OPTIONS: { value: ProfileGender; label: string }[] = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "X", label: "Otro" },
];

/**
 * Corrección del género de un perfil, a pedido de su titular (F3).
 *
 * En la app el género se elige una sola vez: define la composición de los
 * equipos Mixtos, así que cambiarlo sólo se hace por soporte. Por eso el
 * diálogo pide el motivo —la constancia del pedido— y la RPC lo guarda en
 * app_logs junto con el valor anterior.
 */
export function ProfileGenderDialog({
  user,
  onOpenChange,
}: {
  user: AdminUserRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={user !== null} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Cuerpo aparte: Radix lo desmonta al cerrar y el estado nace limpio
            en cada apertura (mismo criterio que ConfirmDialog). */}
        {user ? (
          <ProfileGenderBody
            user={user}
            isPending={isPending}
            startTransition={startTransition}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ProfileGenderBody({
  user,
  isPending,
  startTransition,
  onClose,
}: {
  user: AdminUserRow;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState<
    { status: "loading" } | { status: "ok"; gender: ProfileGender | null } | { status: "error"; error: string }
  >({ status: "loading" });
  const [selected, setSelected] = useState<ProfileGender | null>(null);
  const [reason, setReason] = useState("");
  const reasonId = useId();

  useEffect(() => {
    let cancelled = false;
    void getProfileGenderAction({ profileId: user.profile_id }).then((result) => {
      if (cancelled) return;
      setCurrent(result.ok ? { status: "ok", gender: result.gender } : { status: "error", error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [user.profile_id]);

  const currentGender = current.status === "ok" ? current.gender : null;
  const canSubmit =
    current.status === "ok" &&
    selected !== null &&
    selected !== currentGender &&
    reason.trim().length > 0 &&
    !isPending;

  function handleSubmit() {
    if (!canSubmit || !selected) return;
    startTransition(async () => {
      const result = await setProfileGenderAction({
        profileId: user.profile_id,
        gender: selected,
        reason,
      });
      if (result.ok) {
        toast.success("Listo", { description: result.message });
        onClose();
      } else {
        toast.error("No se pudo corregir el género", { description: result.error });
      }
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl uppercase">Corregir género</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-neutral-on-surface-variant">
          <strong className="text-neutral-on-surface">
            {user.full_name} (@{user.username})
          </strong>
          . Hacelo sólo a pedido del titular, escrito desde su cuenta.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border border-warning-tertiary/30 bg-warning-tertiary/10 p-3 text-xs leading-relaxed text-warning-tertiary">
        El género define si un equipo Mixto cumple la composición mínima: el cambio puede
        habilitar o bloquear a sus equipos para desafiar, confirmar partidos y hacer el check-in.
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-neutral-on-surface-variant">
          Actual:{" "}
          {current.status === "loading" ? (
            <Loader2 className="inline size-3 animate-spin" aria-label="Cargando" />
          ) : current.status === "error" ? (
            <span className="text-danger-error">{current.error}</span>
          ) : (
            <span className="text-neutral-on-surface">
              {OPTIONS.find((o) => o.value === currentGender)?.label ?? "Sin cargar"}
            </span>
          )}
        </span>
        <div role="radiogroup" aria-label="Género nuevo" className="flex gap-2">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected === option.value}
              disabled={current.status !== "ok" || option.value === currentGender || isPending}
              onClick={() => setSelected(option.value)}
              className={cn(
                "flex-1 rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-40",
                selected === option.value
                  ? "border-brand-primary bg-brand-primary/15 text-brand-primary"
                  : "border-neutral-outline-variant bg-surface-low text-neutral-on-surface hover:bg-surface-high",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={reasonId} className="text-xs font-semibold text-neutral-on-surface-variant">
          Motivo (obligatorio)
        </label>
        <textarea
          id={reasonId}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej.: correo del titular del 25/09 desde la cuenta"
          rows={3}
          className="w-full resize-y rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-2 text-sm text-neutral-on-surface outline-none placeholder:text-neutral-outline focus:border-brand-primary"
        />
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Corregir
        </Button>
      </DialogFooter>
    </>
  );
}
