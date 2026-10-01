"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { LayoutDashboard, LogOut, Menu, Scale, TrendingUp, type LucideIcon } from "lucide-react";

import { signOut } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { PenaltyCard } from "@/components/ui/PenaltyCard";
import type { QueueCounts } from "@/lib/admin-queues-data";
import { NAV_GROUPS, QUEUE_ITEMS, isItemActive, type NavItem } from "./nav-items";

type SheetKind = "queues" | "more";

/** Lo que va en «Más»: todo lo que no tiene acceso propio en la barra. */
const MORE_GROUPS = NAV_GROUPS.map((group) => ({
  ...group,
  items: group.items.filter(
    (item) =>
      item.href !== "/dashboard" && item.href !== "/dashboard/growth" && !item.badge,
  ),
})).filter((group) => group.items.length > 0);

/**
 * Barra inferior del celular: Resumen, Colas, Crecimiento y Más.
 *
 * Colas y Más abren una hoja desde abajo en vez de navegar, porque cada uno
 * agrupa varias pantallas. La tarjeta amarilla de Colas suma los pendientes
 * de las tres: desde cualquier pantalla se ve si hay algo para decidir.
 */
export function MobileNav({ username, counts }: { username: string; counts: QueueCounts }) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState<SheetKind | null>(null);

  const totalPending = counts.disputes + counts.woClaims + counts.reports;
  const inQueues = QUEUE_ITEMS.some((item) => isItemActive(item.href, pathname));
  const inMore = MORE_GROUPS.some((g) => g.items.some((i) => isItemActive(i.href, pathname)));

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-chalk-line bg-pitch-deep/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-4">
          <li>
            <BarLink href="/dashboard" label="Resumen" icon={LayoutDashboard} active={pathname === "/dashboard"} />
          </li>
          <li>
            <BarButton
              label="Colas"
              icon={Scale}
              active={inQueues}
              count={totalPending}
              onClick={() => setSheet("queues")}
            />
          </li>
          <li>
            <BarLink
              href="/dashboard/growth"
              label="Crecimiento"
              icon={TrendingUp}
              active={isItemActive("/dashboard/growth", pathname)}
            />
          </li>
          <li>
            <BarButton label="Más" icon={Menu} active={inMore} onClick={() => setSheet("more")} />
          </li>
        </ul>
      </nav>

      <DialogPrimitive.Root open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 md:hidden" />
          <DialogPrimitive.Content
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-xl border-t border-chalk-line bg-pitch px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden",
              "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
            )}
          >
            <span aria-hidden="true" className="mx-auto mb-3 block h-1 w-10 rounded-full bg-chalk-line" />
            <DialogPrimitive.Title className="px-2 pb-2 text-lg font-semibold text-chalk">
              {sheet === "queues" ? "Colas" : "Más"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              {sheet === "queues"
                ? "Disputas, reclamos de WO y denuncias que esperan una decisión."
                : "El resto de las pantallas del dashboard."}
            </DialogPrimitive.Description>

            {sheet === "queues" ? (
              <ul className="flex flex-col">
                {QUEUE_ITEMS.map((item) => (
                  <li key={item.href}>
                    <SheetLink
                      item={item}
                      count={item.badge ? counts[item.badge] : 0}
                      active={isItemActive(item.href, pathname)}
                      onNavigate={() => setSheet(null)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-4">
                {MORE_GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="px-2 pb-1 text-[13px] text-chalk-faint">{group.title}</p>
                    <ul className="flex flex-col">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <SheetLink
                            item={item}
                            count={0}
                            active={isItemActive(item.href, pathname)}
                            onNavigate={() => setSheet(null)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="border-t border-chalk-line pt-3">
                  <p className="truncate px-2 pb-1 text-[13px] text-chalk-faint">{username}</p>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex h-12 w-full items-center gap-3 rounded-md px-2 text-left text-base text-chalk-dim hover:bg-slate"
                    >
                      <LogOut className="size-5" aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

const BAR_ITEM_CLASS =
  "relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chalk";

function BarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(BAR_ITEM_CLASS, active ? "font-medium text-chalk" : "text-chalk-faint")}
    >
      <ActiveMark active={active} />
      <Icon className="size-5" aria-hidden="true" />
      {label}
    </Link>
  );
}

function BarButton({
  label,
  icon: Icon,
  active,
  count = 0,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className={cn(BAR_ITEM_CLASS, active ? "font-medium text-chalk" : "text-chalk-faint")}
    >
      <ActiveMark active={active} />
      <span className="relative">
        <Icon className="size-5" aria-hidden="true" />
        <PenaltyCard count={count} className="absolute -right-4 -top-2.5" />
      </span>
      {label}
      {count > 0 ? <span className="sr-only">{`, ${count} pendientes`}</span> : null}
    </button>
  );
}

function ActiveMark({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-x-6 top-0 h-[3px] rounded-b bg-chalk transition-opacity",
        active ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

function SheetLink({
  item,
  count,
  active,
  onNavigate,
}: {
  item: NavItem;
  count: number;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-12 items-center gap-3 rounded-md px-2 text-base",
        active ? "bg-slate font-medium text-chalk" : "text-chalk-dim hover:bg-slate",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      {item.label}
      <PenaltyCard count={count} className="ml-auto" />
      {count > 0 ? <span className="sr-only">{`, ${count} pendientes`}</span> : null}
    </Link>
  );
}
