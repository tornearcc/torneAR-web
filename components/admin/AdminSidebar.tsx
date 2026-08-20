"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Activity,
  CalendarRange,
  Flag,
  ImageIcon,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Radar,
  Scale,
  Settings,
  Share2,
  ShieldAlert,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { signOut } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME } from "@/lib/sidebar-state";
import type { QueueCounts } from "@/lib/admin-queues-data";

/** Clave del contador que alimenta el badge de un ítem, si tiene. */
type BadgeKey = keyof QueueCounts;

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: BadgeKey;
}

// Los 5 paneles + Configuración de la spec (§6, Hitos 1-6) más los tres
// módulos de gestión migrados de la app móvil, agrupados por naturaleza: lo
// que se lee vs. lo que se opera.
const NAV_GROUPS: ReadonlyArray<{ title: string; items: readonly NavItem[] }> = [
  {
    title: "Analítica",
    items: [
      { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
      { href: "/dashboard/growth", label: "Crecimiento", icon: TrendingUp },
      { href: "/dashboard/viral", label: "Viralidad", icon: Share2 },
      { href: "/dashboard/social", label: "Redes", icon: Radar },
      { href: "/dashboard/content", label: "Contenido", icon: ImageIcon },
      { href: "/dashboard/activity", label: "Actividad", icon: Activity },
      { href: "/dashboard/health", label: "Salud", icon: HeartPulse },
    ],
  },
  {
    title: "Gestión",
    items: [
      { href: "/dashboard/disputes", label: "Disputas", icon: Scale, badge: "disputes" },
      { href: "/dashboard/wo-claims", label: "Reclamos WO", icon: Flag, badge: "woClaims" },
      {
        href: "/dashboard/moderation",
        label: "Moderación",
        icon: ShieldAlert,
        badge: "reports",
      },
      { href: "/dashboard/seasons", label: "Temporadas", icon: CalendarRange },
      { href: "/dashboard/users", label: "Usuarios", icon: Users },
    ],
  },
  {
    title: "Sistema",
    items: [{ href: "/dashboard/settings", label: "Configuración", icon: Settings }],
  },
];

function isItemActive(href: string, pathname: string) {
  // `/dashboard` es prefijo de todas las demás rutas: sin este caso especial
  // el ítem Resumen quedaría activo en todos los paneles.
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

export function AdminSidebar({
  username,
  defaultCollapsed,
  counts,
}: {
  username: string;
  /**
   * Estado inicial leído de la cookie en el Server Component padre. Va por
   * cookie y no por localStorage porque el servidor tiene que renderizar el
   * ancho correcto en el primer paint: con localStorage el sidebar aparecería
   * expandido y se cerraría de golpe al hidratar.
   */
  defaultCollapsed: boolean;
  /** Pendientes por cola. Se recalculan en cada navegación (layout dinámico). */
  counts: QueueCounts;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${next ? "1" : "0"}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`;
      return next;
    });
  }, []);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        // `sticky top-0 h-dvh` es lo que lo mantiene a la altura completa de
        // la ventana: el scroll vive en el <main> del layout, no acá.
        "sticky top-0 flex h-dvh shrink-0 flex-col justify-between overflow-hidden",
        "border-r border-neutral-outline-variant bg-surface-lowest",
        "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            "flex h-[65px] shrink-0 items-center border-b border-neutral-outline-variant",
            collapsed ? "justify-center px-2" : "justify-between px-6",
          )}
        >
          {/*
            `whitespace-nowrap` + overflow oculto del <aside>: el texto se
            recorta contra el borde en vez de reflowear a dos líneas durante
            los 300ms que dura la animación de ancho.
          */}
          <span
            className={cn(
              "font-display whitespace-nowrap text-lg uppercase tracking-wide text-neutral-on-surface",
              "transition-opacity duration-200",
              collapsed && "pointer-events-none w-0 opacity-0",
            )}
          >
            torneAR <span className="text-brand-primary">admin</span>
          </span>

          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            aria-expanded={!collapsed}
            className="rounded-md p-1.5 text-neutral-on-surface-variant transition-colors hover:bg-surface-container hover:text-neutral-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* El <nav> scrollea solo si la lista crece más que la ventana. */}
        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              <p
                className={cn(
                  "px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-outline",
                  "transition-all duration-200",
                  collapsed ? "h-0 overflow-hidden opacity-0" : "h-4 opacity-100",
                )}
              >
                {group.title}
              </p>

              {group.items.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  isActive={isItemActive(item.href, pathname)}
                  count={item.badge ? counts[item.badge] : 0}
                />
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="shrink-0 border-t border-neutral-outline-variant p-3">
        <p
          className={cn(
            "truncate px-3 py-1 text-xs text-neutral-on-surface-variant transition-opacity duration-200",
            collapsed && "h-0 overflow-hidden py-0 opacity-0",
          )}
        >
          {username}
        </p>
        <form action={signOut}>
          <SidebarButton collapsed={collapsed} label="Cerrar sesión" icon={LogOut} />
        </form>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  collapsed,
  isActive,
  count,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  count: number;
}) {
  const Icon = item.icon;
  const hasBadge = count > 0;
  const pendingText = hasBadge ? `${count} pendiente${count === 1 ? "" : "s"}` : null;

  const link = (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        isActive
          ? "bg-surface-container text-brand-primary"
          : "text-neutral-on-surface-variant hover:bg-surface-container hover:text-neutral-on-surface",
      )}
    >
      {/* Marca de activo que sobrevive al colapso, donde el color del texto
          ya no alcanza porque no hay texto. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand-primary transition-opacity",
          isActive ? "opacity-100" : "opacity-0",
        )}
      />

      <span className="relative shrink-0">
        <Icon className="size-4" aria-hidden="true" />
        {/* Colapsado no hay lugar para el número: queda un punto, que sigue
            diciendo "acá hay algo" sin depender de leer una cifra de 8px. */}
        {hasBadge && collapsed ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 size-2 rounded-full bg-warning-tertiary ring-2 ring-surface-lowest"
          />
        ) : null}
      </span>

      <span
        className={cn(
          "whitespace-nowrap transition-opacity duration-200",
          collapsed && "sr-only",
        )}
      >
        {item.label}
      </span>

      {hasBadge && !collapsed ? (
        <span className="ml-auto rounded-full bg-warning-tertiary/20 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-warning-tertiary">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}

      {/* El punto de arriba es aria-hidden, así que colapsado el conteo se
          perdería para un lector de pantalla si no se dijera acá. */}
      {pendingText && collapsed ? <span className="sr-only">{pendingText}</span> : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {pendingText ? `${item.label} · ${pendingText}` : item.label}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarButton({
  collapsed,
  label,
  icon: Icon,
}: {
  collapsed: boolean;
  label: string;
  icon: LucideIcon;
}) {
  const button = (
    <button
      type="submit"
      aria-label={collapsed ? label : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-md py-2 text-sm text-neutral-on-surface-variant transition-colors hover:bg-surface-container hover:text-neutral-on-surface",
        collapsed ? "justify-center px-0" : "px-3 text-left",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className={cn("whitespace-nowrap", collapsed && "sr-only")}>{label}</span>
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
