import Link from "next/link";

import { requireAdminAuth } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { AmbassadorRewardsTable } from "@/components/admin/AmbassadorRewardsTable";
import { AmbassadorsTable } from "@/components/admin/AmbassadorsTable";
import { StatCard } from "@/components/charts/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { StatBoard } from "@/components/ui/Scoreboard";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/**
 * Programa de embajadores: tanteador, premios por pagar y embajadores.
 *
 * Las tres lecturas son RPCs `dashboard_ambassador*` (exigen is_admin adentro)
 * y las mutaciones son Server Actions de `lib/admin-actions.ts`. El interruptor,
 * el arranque y los montos se editan en Configuración.
 */
export default async function AmbassadorsPage() {
  // Guarda propia además de la del layout (P2-12).
  await requireAdminAuth();

  const supabase = await createClient();
  const [summaryResult, rewardsResult, ambassadorsResult] = await Promise.all([
    supabase.rpc("dashboard_ambassador_summary").maybeSingle(),
    supabase.rpc("dashboard_ambassador_rewards"),
    supabase.rpc("dashboard_ambassadors"),
  ]);

  const summary = summaryResult.data;
  const rewards = rewardsResult.data ?? [];
  const ambassadors = ambassadorsResult.data ?? [];
  const pendingRewards = rewards.filter((r) => r.status === "PENDIENTE").length;

  return (
    <PageTransition className="gap-8">
      <PageHeader
        title="Embajadores"
        description="Quién se inscribió, quién sigue a @tornear.app y qué premios hay para pagar."
        actions={
          <Link
            href="/dashboard/settings"
            className="rounded-md border border-chalk-line px-3 py-2 text-sm font-medium text-chalk transition-colors hover:bg-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk"
          >
            Interruptor y montos
          </Link>
        }
      />

      {summaryResult.error ? (
        <ErrorBox context="el resumen" message={summaryResult.error.message} />
      ) : (
        <StatBoard
          hero={
            <StatCard
              size="hero"
              label="Lugares usados"
              value={`${summary?.slots_used ?? 0} / ${summary?.slots_total ?? 100}`}
              hint="equipos traídos con premio, sin contar los rechazados"
            />
          }
        >
          <StatCard
            label="Programa"
            value={summary?.enabled ? "Prendido" : "Apagado"}
            tone={summary?.enabled ? "positive" : "warning"}
            hint="se cambia en Configuración"
          />
          <StatCard
            label="Comprometido"
            value={money.format(summary?.committed ?? 0)}
            hint="pendiente + pagado"
          />
          <StatCard label="Pagado" value={money.format(summary?.paid ?? 0)} />
          <StatCard label="Inscriptos" value={summary?.ambassadors ?? 0} />
          <StatCard
            label="Follows por verificar"
            value={summary?.pending_follow_checks ?? 0}
            tone={(summary?.pending_follow_checks ?? 0) > 0 ? "warning" : "neutral"}
            hint="embajadores activos"
          />
          <StatCard
            label="Premios pendientes"
            value={pendingRewards}
            tone={pendingRewards > 0 ? "warning" : "neutral"}
          />
        </StatBoard>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-chalk">Premios</h2>
        {rewardsResult.error ? (
          <ErrorBox context="los premios" message={rewardsResult.error.message} />
        ) : (
          <AmbassadorRewardsTable rewards={rewards} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-chalk">Embajadores</h2>
        {ambassadorsResult.error ? (
          <ErrorBox context="los embajadores" message={ambassadorsResult.error.message} />
        ) : (
          <AmbassadorsTable ambassadors={ambassadors} />
        )}
      </section>
    </PageTransition>
  );
}

function ErrorBox({ context, message }: { context: string; message: string }) {
  return (
    <p className="rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
      No se pudo cargar {context}: {message}
    </p>
  );
}
