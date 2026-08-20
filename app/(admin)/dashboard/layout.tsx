import { cookies } from "next/headers";

import { requireAdminAuth } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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
      {/*
        `h-dvh overflow-hidden` en el contenedor + scroll exclusivo en <main>:
        sin esto el <aside> sólo se estira hasta el alto del contenido y se va
        con el scroll de la página. `dvh` y no `vh` por las barras dinámicas
        de los navegadores móviles.
      */}
      <div className="flex h-dvh overflow-hidden">
        <AdminSidebar
          username={profile.username}
          defaultCollapsed={sidebarCollapsed}
          counts={counts}
        />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}
