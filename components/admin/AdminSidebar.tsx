"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-actions";

// Los 5 paneles + Configuración de la spec (§6, Hitos 1-6) — con esto la
// navegación queda completa.
const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/growth", label: "Crecimiento" },
  { href: "/dashboard/viral", label: "Viralidad" },
  { href: "/dashboard/moderation", label: "Moderación" },
  { href: "/dashboard/activity", label: "Actividad" },
  { href: "/dashboard/health", label: "Salud" },
  { href: "/dashboard/settings", label: "Configuración" },
] as const;

export function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-neutral-outline-variant bg-surface-lowest">
      <div>
        <div className="border-b border-neutral-outline-variant px-6 py-5">
          <span className="font-display text-lg uppercase tracking-wide text-neutral-on-surface">
            torneAR <span className="text-brand-primary">admin</span>
          </span>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-surface-container text-brand-primary"
                    : "text-neutral-on-surface-variant hover:bg-surface-container hover:text-neutral-on-surface"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-neutral-outline-variant p-3">
        <p className="truncate px-3 py-1 text-xs text-neutral-on-surface-variant">{username}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-on-surface-variant transition hover:bg-surface-container hover:text-neutral-on-surface"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
