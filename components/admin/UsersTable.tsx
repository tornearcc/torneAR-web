"use client";

import { useState, useTransition } from "react";
import {
  MoreHorizontal,
  ShieldCheck,
  ShieldMinus,
  ShieldOff,
  Trash2,
  UserCheck,
  UserPen,
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
import { ProfileGenderDialog } from "@/components/admin/ProfileGenderDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  deleteAccountAction,
  setAdminFlagAction,
  setUserSuspensionAction,
} from "@/lib/admin-actions";
import { cn } from "@/lib/utils";
import type { AdminUserRow } from "@/lib/users-data";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  // Zona fija: servidor y navegador tienen que formatear igual (hidratación).
  timeZone: "America/Argentina/Buenos_Aires",
});

type PendingAction =
  | { kind: "suspend" | "unban"; user: AdminUserRow }
  | { kind: "grant-admin" | "revoke-admin"; user: AdminUserRow }
  | { kind: "delete"; user: AdminUserRow };

/** Mismo placeholder que pone `anonymize_account` (migración 20260929120000). */
function isDeletedAccount(user: AdminUserRow): boolean {
  return user.username.startsWith("usuario_eliminado_");
}

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
  const [genderUser, setGenderUser] = useState<AdminUserRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm(notes: string, typed: string) {
    if (!pending) return;
    const { kind, user } = pending;

    startTransition(async () => {
      const result =
        kind === "delete"
          ? await deleteAccountAction({
              profileId: user.profile_id,
              reason: notes,
              confirmation: typed,
              expectedUsername: user.username,
            })
          : kind === "suspend" || kind === "unban"
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
      <div className="overflow-x-auto">
        <table className="ledger-stack w-full border-collapse text-left text-[15px] md:min-w-[900px]">
          <thead>
            <tr className="border-b border-chalk-line text-[13px] text-chalk-faint">
              <th className="px-3 py-2 font-normal">Usuario</th>
              <th className="px-3 py-2 font-normal">Zona</th>
              <th className="px-3 py-2 font-normal">Alta</th>
              <th className="px-3 py-2 font-normal">Equipos</th>
              <th className="px-3 py-2 font-normal">Partidos</th>
              <th className="px-3 py-2 font-normal">Referido por</th>
              <th className="w-12 px-3 py-2"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.profile_id === currentAdminProfileId;
              const isDeleted = isDeletedAccount(user);

              return (
                <tr
                  key={user.profile_id}
                  className={cn(
                    "border-b border-chalk-line",
                    user.is_suspended && !isDeleted && "bg-card-red/5",
                  )}
                >
                  <td data-label="Usuario" className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-chalk">
                        {user.full_name}
                      </span>
                      <span className="text-chalk-faint">
                        @{user.username}
                      </span>
                      {user.is_admin ? (
                        <Badge className="border border-chalk-line text-chalk">
                          <ShieldCheck className="size-3" aria-hidden="true" />
                          Admin
                        </Badge>
                      ) : null}
                      {isDeleted ? (
                        <Badge className="border border-chalk-line text-chalk-faint">
                          <Trash2 className="size-3" aria-hidden="true" />
                          Eliminada
                        </Badge>
                      ) : user.is_suspended ? (
                        <Badge className="bg-card-red text-white">
                          <ShieldOff className="size-3" aria-hidden="true" />
                          Suspendido
                        </Badge>
                      ) : null}
                      {isSelf ? (
                        <Badge className="border border-chalk-line text-chalk-faint">Vos</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td data-label="Zona" className="px-3 py-3 text-chalk-dim">
                    {user.zone ?? "—"}
                  </td>
                  <td data-label="Alta" className="whitespace-nowrap px-3 py-3 text-chalk-dim">
                    {DATE_FORMATTER.format(new Date(user.created_at))}
                  </td>
                  <td data-label="Equipos" className="px-3 py-3 tabular-nums text-chalk-dim">
                    {user.teams_count}
                  </td>
                  <td data-label="Partidos" className="px-3 py-3 tabular-nums text-chalk-dim">
                    {user.matches_count}
                  </td>
                  <td data-label="Referido por" className="px-3 py-3 text-chalk-dim">
                    {user.referred_by_username ? `@${user.referred_by_username}` : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Acciones sobre @${user.username}`}
                          disabled={isPending}
                          className="flex items-center gap-2 rounded-md border border-chalk-line px-3 py-2 text-sm text-chalk-dim transition-colors hover:bg-slate hover:text-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk disabled:opacity-40 md:border-transparent md:p-1.5"
                        >
                          <MoreHorizontal className="size-4" aria-hidden="true" />
                          <span className="md:hidden" aria-hidden="true">
                            Acciones
                          </span>
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
                        ) : isDeleted ? (
                          <DropdownMenuItem disabled>Cuenta dada de baja</DropdownMenuItem>
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

                            {/* F3: el género sólo lo corrige soporte, a pedido del titular. */}
                            <DropdownMenuItem onSelect={() => setGenderUser(user)}>
                              <UserPen className="size-4" aria-hidden="true" />
                              Corregir género
                            </DropdownMenuItem>

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

                            {/* A un admin primero hay que quitarle el rol
                                (la RPC lo rechaza con TARGET_IS_ADMIN). */}
                            {!user.is_admin ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => setPending({ kind: "delete", user })}
                                >
                                  <Trash2 className="size-4" aria-hidden="true" />
                                  Eliminar cuenta
                                </DropdownMenuItem>
                              </>
                            ) : null}
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
        // Los cambios de rol y la baja piden tipear el usuario. Suspender es
        // reversible en un click; otorgar admin le da a alguien la llave del
        // dashboard entero, y la baja no tiene vuelta atrás.
        requireTypedConfirmation={
          pending && (pending.kind.endsWith("-admin") || pending.kind === "delete")
            ? pending.user.username
            : null
        }
        showNotesInput={pending?.kind === "delete"}
        notesLabel="Motivo (obligatorio, queda en los logs)"
        notesPlaceholder="Ej.: es menor de edad, lo dijo en el chat del partido del 12/10"
        onConfirm={handleConfirm}
      />

      <ProfileGenderDialog user={genderUser} onOpenChange={(open) => !open && setGenderUser(null)} />
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
  delete: {
    title: "¿Eliminar la cuenta?",
    impact:
      "Es lo mismo que si la persona se diera de baja desde la app: el perfil queda como «Usuario eliminado», se borran sus fotos, pierde el acceso y se revoca su acceso con Apple. Los partidos y equipos quedan con el perfil anonimizado. No se puede deshacer.",
    label: "Eliminar cuenta",
    danger: true,
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
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}
