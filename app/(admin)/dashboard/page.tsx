import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/charts/StatCard";

const PANELS = [
  { href: "/dashboard/growth", label: "Crecimiento", description: "Altas, equipos y partidos." },
  { href: "/dashboard/viral", label: "Viralidad", description: "Referidos y embajadores." },
  { href: "/dashboard/moderation", label: "Moderación", description: "Denuncias y feedback." },
  { href: "/dashboard/activity", label: "Actividad", description: "Partidos por estado." },
  { href: "/dashboard/health", label: "Salud", description: "Errores y explorador de logs." },
] as const;

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const { data: summary, error } = await supabase.rpc("dashboard_growth_summary").maybeSingle();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl uppercase text-neutral-on-surface">Resumen</h1>
        <p className="text-sm text-neutral-on-surface-variant">Vista rápida de torneAR.</p>
      </div>

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudo cargar el resumen: {error.message}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Usuarios" value={summary?.profiles_count ?? 0} />
          <StatCard label="Equipos" value={summary?.teams_count ?? 0} />
          <StatCard label="Partidos" value={summary?.matches_count ?? 0} />
        </div>
      )}

      <div>
        <h2 className="font-display mb-3 text-lg uppercase text-neutral-on-surface">Paneles</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PANELS.map((panel) => (
            <Link
              key={panel.href}
              href={panel.href}
              className="rounded-lg border border-neutral-outline-variant bg-surface-container p-5 transition hover:border-brand-primary hover:bg-surface-high"
            >
              <p className="font-display text-lg uppercase text-neutral-on-surface">
                {panel.label}
              </p>
              <p className="mt-1 text-sm text-neutral-on-surface-variant">{panel.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
