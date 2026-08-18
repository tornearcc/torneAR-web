import { requireAdminAuth } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Único punto de verificación de `is_admin` (§4.3 de WEB_SPECIFICATION.md).
 *
 * Vive en `dashboard/layout.tsx` y no en `(admin)/layout.tsx`: `/login` y
 * `/unauthorized` cuelgan de `(admin)/` pero no de `dashboard/`, así que
 * nunca pasan por este guard. Ponerlo un nivel más arriba crearía un loop
 * de redirects — un usuario sin sesión que entra a `/login` sería
 * redirigido por el layout a... `/login`.
 */
// Explícito por claridad (§1.1 de WEB_SPECIFICATION.md): los datos de
// admin no se cachean entre admins distintos. `cookies()` dentro de
// requireAdminAuth() ya fuerza renderizado dinámico igual, pero dejarlo
// declarado evita que un refactor futuro lo pierda en silencio.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdminAuth();

  return (
    <div className="flex min-h-full">
      <AdminSidebar username={profile.username} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
