import { requireAdminAuth } from "@/lib/admin-guard";
import { fetchDisputedMatches } from "@/lib/admin-queues-data";
import { DisputesQueue } from "@/components/admin/DisputesQueue";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

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
