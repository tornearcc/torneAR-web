"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";

import { signOut } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { PenaltyCard } from "@/components/ui/PenaltyCard";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME } from "@/lib/sidebar-state";
import type { QueueCounts } from "@/lib/admin-queues-data";
import { NAV_GROUPS, isItemActive, type NavItem } from "./nav-items";

/**
 * Barra lateral de la compu. En el celular no se renderiza: ahí la reemplaza
 * `MobileNav`, porque 256 px de una pantalla de 390 dejaban el contenido
 * apretado.
 */
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
        "sticky top-0 hidden h-dvh shrink-0 flex-col justify-between overflow-hidden md:flex",
        "border-r border-chalk-line bg-pitch-deep",
        "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            "flex h-16 shrink-0 items-center",
            collapsed ? "justify-center px-2" : "justify-between pl-5 pr-3",
          )}
        >
          {/*
            `whitespace-nowrap` + overflow oculto del <aside>: el texto se
            recorta contra el borde en vez de reflowear a dos líneas durante
            los 300ms que dura la animación de ancho.
          */}
          <span
            className={cn(
              "whitespace-nowrap text-[17px] font-semibold tracking-tight text-chalk",
              "transition-opacity duration-200",
              collapsed && "pointer-events-none w-0 opacity-0",
            )}
          >
            torneAR <span className="font-normal text-chalk-faint">admin</span>
          </span>

          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            aria-expanded={!collapsed}
            className="rounded-md p-1.5 text-chalk-faint transition-colors hover:bg-slate hover:text-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* El <nav> scrollea solo si la lista crece más que la ventana. */}
        <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-3 pt-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-0.5">
              {collapsed ? (
                // Colapsado, el título del grupo se vuelve una línea de tiza:
                // la separación entre grupos se sigue leyendo sin texto.
                <span aria-hidden="true" className="mx-3 mb-2 h-px bg-chalk-line" />
              ) : (
                <p className="px-3 pb-1.5 text-[13px] text-chalk-faint">{group.title}</p>
              )}

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

      <div className="shrink-0 border-t border-chalk-line p-3">
        <p
          className={cn(
            "truncate px-3 py-1 text-[13px] text-chalk-faint transition-opacity duration-200",
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

function pendingLabel(count: number) {
  return count > 0 ? `${count} pendiente${count === 1 ? "" : "s"}` : null;
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
  const pendingText = pendingLabel(count);

  const link = (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-3 rounded-md text-[15px] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk",
        collapsed ? "justify-center px-0" : "px-3",
        isActive
          ? "bg-slate font-medium text-chalk"
          : "text-chalk-dim hover:bg-slate/60 hover:text-chalk",
      )}
    >
      {/* Marca de activo: una línea de tiza, que sobrevive al colapso. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-chalk transition-opacity",
          isActive ? "opacity-100" : "opacity-0",
        )}
      />

      <span className="relative shrink-0">
        <Icon className="size-4" aria-hidden="true" />
        {/* Colapsado no entra el número: queda una tarjeta mínima. */}
        {count > 0 && collapsed ? (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 h-2.5 w-2 -rotate-6 rounded-[1px] bg-card-yellow"
          />
        ) : null}
      </span>

      <span className={cn("whitespace-nowrap", collapsed && "sr-only")}>{item.label}</span>

      {!collapsed ? <PenaltyCard count={count} className="ml-auto" /> : null}

      {pendingText ? <span className="sr-only">{`, ${pendingText}`}</span> : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {pendingText ? `${item.label}: ${pendingText}` : item.label}
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
        "flex h-9 w-full items-center gap-3 rounded-md text-[15px] text-chalk-dim transition-colors hover:bg-slate/60 hover:text-chalk",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk",
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
