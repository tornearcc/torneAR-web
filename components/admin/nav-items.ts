import {
  Activity,
  CalendarRange,
  Flag,
  HeartPulse,
  ImageIcon,
  LayoutDashboard,
  Radar,
  Scale,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { QueueCounts } from "@/lib/admin-queues-data";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Contador de la cola que se muestra como tarjeta amarilla, si tiene. */
  badge?: keyof QueueCounts;
}

export interface NavGroup {
  title: string;
  items: readonly NavItem[];
}

/**
 * Navegación del dashboard, agrupada por lo que se hace y no por el tipo de
 * pantalla: *Hoy* es lo que puede necesitar una decisión, *Crecimiento* lo
 * que se lee para saber si la liga crece y *Operar* la gestión de cuentas,
 * equipos y sistema. Lo comparten la barra lateral (compu) y la barra
 * inferior (celular) para que las dos digan lo mismo.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: "Hoy",
    items: [
      { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
      { href: "/dashboard/disputes", label: "Disputas", icon: Scale, badge: "disputes" },
      { href: "/dashboard/wo-claims", label: "Reclamos WO", icon: Flag, badge: "woClaims" },
      { href: "/dashboard/moderation", label: "Moderación", icon: ShieldAlert, badge: "reports" },
    ],
  },
  {
    title: "Crecimiento",
    items: [
      { href: "/dashboard/growth", label: "Crecimiento", icon: TrendingUp },
      { href: "/dashboard/viral", label: "Viralidad", icon: Share2 },
      { href: "/dashboard/social", label: "Redes", icon: Radar },
      { href: "/dashboard/content", label: "Contenido", icon: ImageIcon },
      { href: "/dashboard/activity", label: "Actividad", icon: Activity },
    ],
  },
  {
    title: "Operar",
    items: [
      { href: "/dashboard/users", label: "Usuarios", icon: Users },
      { href: "/dashboard/teams", label: "Equipos", icon: Shield },
      { href: "/dashboard/seasons", label: "Temporadas", icon: CalendarRange },
      { href: "/dashboard/health", label: "Salud", icon: HeartPulse },
      { href: "/dashboard/settings", label: "Configuración", icon: Settings },
    ],
  },
];

/** Las tres colas: lo que se opera, no lo que se lee. */
export const QUEUE_ITEMS: readonly NavItem[] = NAV_GROUPS[0].items.filter((item) => item.badge);

export function isItemActive(href: string, pathname: string) {
  // `/dashboard` es prefijo de todas las demás rutas: sin este caso especial
  // el ítem Resumen quedaría activo en todos los paneles.
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}
