"use client";

import { useState, useTransition } from "react";
import {
  MoreHorizontal,
  ShieldCheck,
  ShieldMinus,
  ShieldOff,
  UserCheck,
  UserX,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { setAdminFlagAction, setUserSuspensionAction } from "@/lib/admin-actions";
import { cn } from "@/lib/utils";
import type { AdminUserRow } from "@/lib/users-data";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type PendingAction =
  | { kind: "suspend" | "unban"; user: AdminUserRow }
  | { kind: "grant-admin" | "revoke-admin"; user: AdminUserRow };

export function UsersTable({
  users,
  currentAdminProfileId,
}: {
  users: AdminUserRow[];
  /**
   * Perfil del admin logueado. Se usa para deshabilitar las acciones sobre uno
   * mismo en la UI; las guardas reales viven en las RPCs
   * (`CANNOT_SUSPEND_SELF`, `CANNOT_CHANGE_SELF`), acá sólo se evita ofrecer
   * un botón que va a fallar.
   */
  currentAdminProfileId: string;
}) {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm(_notes: string, typed: string) {
    if (!pending) return;
    const { kind, user } = pending;

    startTransition(async () => {
      const result =
        kind === "suspend" || kind === "unban"
          ? await setUserSuspensionAction({
              profileId: user.profile_id,
              suspend: kind === "suspend",
              reason: `Acción desde Gestión de usuarios sobre @${user.username}`,
            })
          : await setAdminFlagAction({
              profileId: user.profile_id,
              isAdmin: kind === "grant-admin",
              confirmation: typed,
              expectedUsername: user.username,
            });

      if (result.ok) {
        setPending(null);
        toast.success("Listo", { description: result.message });
      } else {
        toast.error("No se pudo aplicar la acción", { description: result.error });
      }
    });
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        tone="neutral"
        title="Sin usuarios"
        description="Ningún usuario coincide con estos filtros."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Zona</th>
              <th className="px-4 py-3 font-medium">Alta</th>
              <th className="px-4 py-3 font-medium">Equipos</th>
              <th className="px-4 py-3 font-medium">Partidos</th>
              <th className="px-4 py-3 font-medium">Referido por</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.profile_id === currentAdminProfileId;

              return (
                <tr
                  key={user.profile_id}
                  className={cn(
                    "border-b border-neutral-outline-variant last:border-0",
                    user.is_suspended && "bg-danger-error-container/10",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-neutral-on-surface">
                        {user.full_name}
                      </span>
                      <span className="text-neutral-on-surface-variant">
                        @{user.username}
                      </span>
                      {user.is_admin ? (
                        <Badge className="bg-brand-primary/15 text-brand-primary">
                          <ShieldCheck className="size-3" aria-hidden="true" />
                          Admin
                        </Badge>
                      ) : null}
                      {user.is_suspended ? (
                        <Badge className="bg-danger-error-container text-danger-on-error-container">
                          <ShieldOff className="size-3" aria-hidden="true" />
                          Suspendido
                        </Badge>
                      ) : null}
                      {isSelf ? (
                        <Badge className="bg-surface-high text-neutral-outline">Vos</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-on-surface-variant">
                    {user.zone ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-on-surface-variant">
                    {DATE_FORMATTER.format(new Date(user.created_at))}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-neutral-on-surface-variant">
                    {user.teams_count}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-neutral-on-surface-variant">
                    {user.matches_count}
                  </td>
                  <td className="px-4 py-3 text-neutral-on-surface-variant">
                    {user.referred_by_username ? `@${user.referred_by_username}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Acciones sobre @${user.username}`}
                          disabled={isPending}
                          className="rounded-md p-1.5 text-neutral-outline transition-colors hover:bg-surface-high hover:text-neutral-on-surface disabled:opacity-40"
                        >
                          <MoreHorizontal className="size-4" aria-hidden="true" />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>@{user.username}</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Sobre uno mismo no se ofrece nada: las dos RPCs lo
                            rechazan igual, y un menú con opciones que siempre
                            fallan es peor que un menú vacío. */}
                        {isSelf ? (
                          <DropdownMenuItem disabled>
                            No podés actuar sobre tu propia cuenta
                          </DropdownMenuItem>
                        ) : (
                          <>
                            {user.is_suspended ? (
                              <DropdownMenuItem
                                onSelect={() => setPending({ kind: "unban", user })}
                              >
                                <UserCheck className="size-4" aria-hidden="true" />
                                Levantar suspensión
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setPending({ kind: "suspend", user })}
                              >
                                <UserX className="size-4" aria-hidden="true" />
                                Suspender usuario
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {user.is_admin ? (
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setPending({ kind: "revoke-admin", user })}
                              >
                                <ShieldMinus className="size-4" aria-hidden="true" />
                                Quitar rol de admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onSelect={() => setPending({ kind: "grant-admin", user })}
                              >
                                <ShieldCheck className="size-4" aria-hidden="true" />
                                Hacer administrador
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending ? DIALOG_COPY[pending.kind].title : ""}
        message={
          pending ? (
            <>
              <strong className="text-neutral-on-surface">
                {pending.user.full_name} (@{pending.user.username})
              </strong>
              .
            </>
          ) : (
            ""
          )
        }
        impact={pending ? DIALOG_COPY[pending.kind].impact : undefined}
        confirmLabel={pending ? DIALOG_COPY[pending.kind].label : "Confirmar"}
        tone={pending && DIALOG_COPY[pending.kind].danger ? "danger" : "primary"}
        loading={isPending}
        // Sólo los cambios de rol piden tipear el usuario. Suspender es
        // reversible en un click; otorgar admin le da a alguien la llave del
        // dashboard entero, incluida la de suspender a los demás.
        requireTypedConfirmation={
          pending && pending.kind.endsWith("-admin") ? pending.user.username : null
        }
        onConfirm={handleConfirm}
      />
    </>
  );
}

const DIALOG_COPY: Record<
  PendingAction["kind"],
  { title: string; impact: string; label: string; danger: boolean }
> = {
  suspend: {
    title: "¿Suspender usuario?",
    impact: "Pierde el acceso a la app de inmediato. Se puede revertir desde acá mismo.",
    label: "Suspender",
    danger: true,
  },
  unban: {
    title: "¿Levantar la suspensión?",
    impact: "Recupera el acceso completo a la app.",
    label: "Levantar",
    danger: false,
  },
  "grant-admin": {
    title: "¿Hacer administrador?",
    impact:
      "Va a poder entrar a este dashboard y usar todo: resolver disputas, cerrar temporadas, suspender cuentas y otorgarle el rol a otros. No hay permisos parciales.",
    label: "Hacer admin",
    danger: false,
  },
  "revoke-admin": {
    title: "¿Quitar el rol de administrador?",
    impact:
      "Pierde el acceso al dashboard, pero conserva su cuenta de jugador. La base no permite revocar al último administrador que queda.",
    label: "Quitar rol",
    danger: true,
  },
};

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        className,
      )}
    >
      {children}
    </span>
  );
}
