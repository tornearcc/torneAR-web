import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileNav } from "@/components/admin/MobileNav";
import type { QueueCounts } from "@/lib/admin-queues-data";

/**
 * Marco de todas las pantallas del dashboard: barra lateral en la compu,
 * barra inferior en el celular y el contenido con ancho de lectura.
 *
 * `data-admin-shell` es lo que activa la paleta de cancha y la letra Archivo
 * (ver `:root:has([data-admin-shell])` en globals.css). Sin el atributo, el
 * dashboard se vería con los colores de la landing.
 */
export function AdminShell({
  username,
  sidebarCollapsed,
  counts,
  children,
}: {
  username: string;
  sidebarCollapsed: boolean;
  counts: QueueCounts;
  children: React.ReactNode;
}) {
  return (
    // `h-dvh overflow-hidden` en el contenedor + scroll exclusivo en <main>:
    // sin esto el <aside> sólo se estira hasta el alto del contenido y se va
    // con el scroll de la página. `dvh` y no `vh` por las barras dinámicas
    // de los navegadores móviles.
    <div data-admin-shell className="flex h-dvh overflow-hidden bg-pitch text-chalk">
      <AdminSidebar username={username} defaultCollapsed={sidebarCollapsed} counts={counts} />
      {/* En el celular, `pb-28` deja el final de la página por encima de la
          barra inferior fija. */}
      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-6 md:px-10 md:pb-12 md:pt-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <MobileNav username={username} counts={counts} />
    </div>
  );
}
