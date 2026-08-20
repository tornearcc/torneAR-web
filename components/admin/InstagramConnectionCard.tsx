"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { disconnectInstagramAction } from "@/lib/social-actions";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type SocialAccountRow = Database["public"]["Tables"]["social_accounts"]["Row"];

const EXPIRY_WARNING_DAYS = 7;

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 1) return "hace instantes";
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.round(hours / 24);
  return `hace ${days}d`;
}

/**
 * Estado de la conexión automatizada de Instagram (Fase 1, pivot a
 * integración automatizada). Vive en /dashboard/social junto al termómetro
 * que alimenta — reconectar o desconectar no toca el histórico de
 * `social_metrics_daily`, sólo el token en Vault.
 */
export function InstagramConnectionCard({ account }: { account: SocialAccountRow }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isConnected = account.access_token_secret_id !== null;
  const expiresInDays = account.token_expires_at ? daysUntil(account.token_expires_at) : null;
  const expiringSoon = expiresInDays !== null && expiresInDays <= EXPIRY_WARNING_DAYS;

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectInstagramAction(account.id);
      if (result.ok) {
        setConfirmOpen(false);
        toast.success("Instagram desconectado", { description: result.message });
      } else {
        toast.error("No se pudo desconectar", { description: result.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-outline-variant bg-surface-container p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-sm uppercase tracking-wide text-neutral-on-surface">
            Instagram
          </p>
          {isConnected ? (
            <span className="flex items-center gap-1 rounded-full bg-brand-primary/15 px-2 py-0.5 text-[11px] font-semibold text-brand-primary">
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Conectado
            </span>
          ) : (
            <span className="rounded-full bg-surface-high px-2 py-0.5 text-[11px] font-semibold text-neutral-on-surface-variant">
              Sin conectar
            </span>
          )}
        </div>

        {isConnected ? (
          <div className="text-sm text-neutral-on-surface-variant">
            <span>@{account.handle}</span>
            {expiresInDays !== null ? (
              <span className={cn("ml-2", expiringSoon && "font-semibold text-warning-tertiary")}>
                · token {expiresInDays <= 0 ? "vencido" : `vence en ${expiresInDays}d`}
              </span>
            ) : null}
            {account.last_synced_at ? (
              <span className="ml-2">· última sync {formatRelative(account.last_synced_at)}</span>
            ) : (
              <span className="ml-2">· todavía no corrió el cron</span>
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-on-surface-variant">
            Sin cuenta conectada — el termómetro no se actualiza solo hasta que autorices el acceso.
          </p>
        )}

        {account.last_sync_error ? (
          <p className="mt-1 max-w-md text-xs text-danger-error">
            Último intento falló: {account.last_sync_error}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button asChild variant={isConnected ? "outline" : "default"} size="sm">
          <a href="/api/instagram/oauth/start">
            {isConnected ? (
              <>
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Reconectar
              </>
            ) : (
              "Conectar Instagram"
            )}
          </a>
        </Button>

        {isConnected ? (
          <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
            Desconectar
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Desconectar Instagram?"
        message="El cron diario deja de traer seguidores nuevos hasta que se vuelva a conectar. El histórico ya guardado no se borra."
        confirmLabel="Desconectar"
        tone="danger"
        loading={isPending}
        onConfirm={handleDisconnect}
      />
    </div>
  );
}
