"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmTone = "primary" | "danger";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: React.ReactNode;
  impact?: React.ReactNode;
  confirmLabel: string;
  tone?: ConfirmTone;
  loading?: boolean;
  showNotesInput?: boolean;
  notesPlaceholder?: string;
  notesLabel?: string;
  /** Texto exacto que el admin debe tipear para habilitar la confirmación. */
  requireTypedConfirmation?: string | null;
  onConfirm: (notes: string, typed: string) => void;
}

/**
 * Diálogo de confirmación de las acciones de gestión, equivalente web del
 * `ConfirmDialog` de la app móvil (`tornear/components/ui/ConfirmDialog.tsx`).
 *
 * Suma dos cosas que en el celular no existían y acá sí hacen falta:
 *
 * - `requireTypedConfirmation`: obliga a tipear un texto exacto antes de
 *   habilitar el botón. Reservado para la transición de temporada, que resetea
 *   los contadores de todos los equipos sin vuelta atrás.
 * - `impact`: el detalle de qué se va a modificar, en un bloque aparte del
 *   mensaje. En una pantalla grande hay lugar para mostrarlo sin que el admin
 *   tenga que acordárselo.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  loading,
  ...rest
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      {/*
        El cuerpo es un componente aparte, y no el contenido inline de este,
        para que la nota y el texto de confirmación se reseteen solos: Radix
        desmonta el DialogContent al cerrar, así que el `useState` de adentro
        nace vacío en cada apertura. La alternativa —limpiarlos en un efecto
        sobre `open`— es un setState en cascada que además vaciaría los campos
        a la vista, a mitad de la animación de salida.
      */}
      <DialogContent className="sm:max-w-lg">
        <ConfirmDialogBody
          {...rest}
          loading={loading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialogBody({
  title,
  message,
  impact,
  confirmLabel,
  tone = "primary",
  loading = false,
  showNotesInput = false,
  notesPlaceholder,
  notesLabel,
  requireTypedConfirmation,
  onConfirm,
  onCancel,
}: Omit<ConfirmDialogProps, "open" | "onOpenChange"> & {
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [typed, setTyped] = useState("");
  const notesId = useId();
  const typedId = useId();

  const typedOk =
    !requireTypedConfirmation || typed.trim() === requireTypedConfirmation;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl uppercase">
          {title}
        </DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-neutral-on-surface-variant">
          {message}
        </DialogDescription>
      </DialogHeader>

      {impact ? (
        <div className="rounded-lg border border-warning-tertiary/30 bg-warning-tertiary/10 p-3 text-xs leading-relaxed text-warning-tertiary">
          {impact}
        </div>
      ) : null}

      {showNotesInput ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={notesId}
            className="text-xs font-semibold text-neutral-on-surface-variant"
          >
            {notesLabel ?? "Nota"}
          </label>
          <textarea
            id={notesId}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={notesPlaceholder}
            rows={3}
            className="w-full resize-y rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-2 text-sm text-neutral-on-surface outline-none placeholder:text-neutral-outline focus:border-brand-primary"
          />
        </div>
      ) : null}

      {requireTypedConfirmation ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={typedId}
            className="text-xs font-semibold text-neutral-on-surface-variant"
          >
            Escribí{" "}
            <span className="font-mono text-neutral-on-surface">
              {requireTypedConfirmation}
            </span>{" "}
            para confirmar
          </label>
          <input
            id={typedId}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="w-full rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-2 font-mono text-sm text-neutral-on-surface outline-none focus:border-brand-primary"
          />
        </div>
      ) : null}

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={() => onConfirm(notes, typed)}
          disabled={loading || !typedOk}
          className={cn(
            // No se usa `variant="destructive"` a propósito: esa variante
            // pinta `text-white` sobre `--destructive`, que en esta paleta
            // es #ffb4ab — un salmón claro pensado para texto de error, no
            // para rellenos. El par container/on-container sí tiene el
            // contraste correcto.
            tone === "danger" &&
              "bg-danger-error-container text-danger-on-error-container hover:bg-danger-error-container/85",
          )}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
