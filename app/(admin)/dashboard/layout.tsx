import type { Viewport } from "next";
import { cookies } from "next/headers";

import { requireAdminAuth } from "@/lib/admin-guard";
import { AdminShell } from "@/components/admin/AdminShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SIDEBAR_COOKIE_NAME } from "@/lib/sidebar-state";
import { fetchQueueCounts } from "@/lib/admin-queues-data";

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

// Barra del navegador con el fondo de la paleta de cancha (`--pitch`), no el
// #131313 de la landing que define el layout raíz.
export const viewport: Viewport = {
  themeColor: "#0F2419",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ profile }, cookieStore] = await Promise.all([requireAdminAuth(), cookies()]);

  // Leer la preferencia acá (y no en el cliente) es lo que evita el flash de
  // sidebar expandido → colapsado en el primer paint tras hidratar.
  const sidebarCollapsed = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === "1";

  // Después del guard, no en paralelo: sin sesión válida estas tres consultas
  // corren como `anon`, devuelven vacío y el usuario termina redirigido a
  // /login igual — trabajo tirado en cada request no autenticado.
  const counts = await fetchQueueCounts();

  return (
    <TooltipProvider delayDuration={200}>
      <AdminShell username={profile.username} sidebarCollapsed={sidebarCollapsed} counts={counts}>
        {children}
      </AdminShell>
      <Toaster />
    </TooltipProvider>
  );
}
