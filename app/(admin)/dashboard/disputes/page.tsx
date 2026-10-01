import { requireAdminAuth } from "@/lib/admin-guard";
import { fetchDisputedMatches } from "@/lib/admin-queues-data";
import { DisputesQueue } from "@/components/admin/DisputesQueue";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

/** «2 partidos sin acuerdo de resultado. Uno no se puede desempatar solo y va primero.» */
function describeQueue(total: number, deadlocked: number) {
  if (total === 0) return "Ningún partido esperando una decisión.";
  const head =
    total === 1 ? "Un partido sin acuerdo de resultado." : `${total} partidos sin acuerdo de resultado.`;
  if (deadlocked === 0) return head;
  const tail =
    deadlocked === 1
      ? "Uno no se puede desempatar solo y va primero."
      : `${deadlocked} no se pueden desempatar solos y van primero.`;
  return `${head} ${tail}`;
}

// Migrado de `tornear/app/admin/dispute-review.tsx`.
export default async function DisputesPage() {
  // Guarda propia además de la del layout: en el App Router corren en
  // paralelo y sin esto la página consulta igual sin sesión (P2-12).
  await requireAdminAuth();

  const { matches, error } = await fetchDisputedMatches();

  const deadlocked = matches.filter((m) => m.isDeadlocked).length;

  return (
    <PageTransition>
      <PageHeader
        title="Disputas"
        description={error ? undefined : describeQueue(matches.length, deadlocked)}
      />

      {error ? (
        <p className="rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
          No se pudieron cargar las disputas: {error}. Recargá la página para reintentar.
        </p>
      ) : (
        <DisputesQueue matches={matches} />
      )}
    </PageTransition>
  );
}
