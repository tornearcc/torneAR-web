import { Award, Share2, TrendingUp, UserPlus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/charts/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Panel de Viralidad.
 *
 * Dejó de ser un empty-state estático: ahora consulta de verdad. Mientras el
 * sistema de referidos no se use, los KPIs muestran ceros reales y el ranking
 * su propio vacío — que es distinto de un placeholder, porque el día que
 * aparezca el primer referido el panel se llena solo, sin tocar código.
 */
export default async function ViralPage() {
  const supabase = await createClient();

  const [summaryResult, referrersResult] = await Promise.all([
    supabase.rpc("dashboard_referral_summary").maybeSingle(),
    supabase.rpc("dashboard_top_referrers", { p_limit: 10 }),
  ]);

  const summary = summaryResult.data;
  const referrers = referrersResult.data ?? [];

  return (
    <PageTransition>
      <PageHeader
        title="Viralidad"
        description="Referidos, embajadores y cuánto crece torneAR por recomendación."
      />

      {summaryResult.error ? (
        <ErrorBox context="el resumen de viralidad" message={summaryResult.error.message} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Usuarios referidos"
            value={summary?.referred_count ?? 0}
            hint={`de ${(summary?.total_profiles ?? 0).toLocaleString("es-AR")} en total`}
            icon={UserPlus}
            tone={(summary?.referred_count ?? 0) > 0 ? "positive" : "neutral"}
          />
          <StatCard
            label="Tasa de referidos"
            value={
              summary?.referral_rate === null || summary?.referral_rate === undefined
                ? null
                : `${summary.referral_rate}%`
            }
            hint="del total de altas"
            icon={TrendingUp}
          />
          {/*
            Referidores distintos no es lo mismo que referidos, y la diferencia
            es el dato: un solo embajador muy activo infla el primer número y
            deja éste en 1. Es lo que dice si el canal se sostiene solo o
            depende de una persona.
          */}
          <StatCard
            label="Referidores distintos"
            value={summary?.referrer_count ?? 0}
            hint="personas que trajeron al menos a alguien"
            icon={Share2}
          />
          <StatCard
            label="Embajadores"
            value={summary?.ambassador_count ?? 0}
            hint="con la insignia otorgada"
            icon={Award}
          />
        </div>
      )}

      <section>
        <h2 className="font-display mb-3 text-lg uppercase text-neutral-on-surface">
          Top embajadores
        </h2>

        {referrersResult.error ? (
          <ErrorBox context="el ranking de embajadores" message={referrersResult.error.message} />
        ) : referrers.length === 0 ? (
          <EmptyState
            icon={Share2}
            tone="neutral"
            title="Sin referidos todavía"
            description="Este ranking se llena solo cuando el primer usuario invite a otro. No hace falta tocar nada."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
                  <th className="w-12 px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Usuario</th>
                  <th className="px-4 py-2 font-medium">Referidos</th>
                  <th className="px-4 py-2 font-medium">Insignia</th>
                </tr>
              </thead>
              <tbody>
                {referrers.map((referrer, index) => (
                  <tr
                    key={referrer.profile_id}
                    className="border-b border-neutral-outline-variant last:border-0"
                  >
                    <td className="px-4 py-2.5 tabular-nums text-neutral-outline">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-neutral-on-surface">{referrer.full_name}</span>{" "}
                      <span className="text-neutral-on-surface-variant">
                        @{referrer.username}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-brand-primary">
                      {referrer.referred_count}
                    </td>
                    <td className="px-4 py-2.5">
                      {referrer.is_ambassador ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold/15 px-2 py-0.5 text-[11px] font-semibold text-brand-gold">
                          <Award className="size-3" aria-hidden="true" />
                          Embajador
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-outline">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageTransition>
  );
}

function ErrorBox({ context, message }: { context: string; message: string }) {
  return (
    <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
      No se pudo cargar {context}: {message}
    </p>
  );
}
