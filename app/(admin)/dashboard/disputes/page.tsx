import { fetchDisputedMatches } from "@/lib/admin-queues-data";
import { DisputesQueue } from "@/components/admin/DisputesQueue";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

// Migrado de `tornear/app/admin/dispute-review.tsx`.
export default async function DisputesPage() {
  const { matches, error } = await fetchDisputedMatches();

  const deadlocked = matches.filter((m) => m.isDeadlocked).length;

  return (
    <PageTransition>
      <PageHeader
        title="Disputas"
        description={
          error
            ? "Cola de resolución de partidos en disputa."
            : `${matches.length} partido${matches.length === 1 ? "" : "s"} en disputa${
                deadlocked > 0 ? ` · ${deadlocked} sin desempate automático posible` : ""
              }.`
        }
      />

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudieron cargar las disputas: {error}
        </p>
      ) : (
        <DisputesQueue matches={matches} />
      )}
    </PageTransition>
  );
}
