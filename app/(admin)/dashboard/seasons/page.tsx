import { requireAdminAuth } from "@/lib/admin-guard";
import { fetchSeasons } from "@/lib/admin-queues-data";
import { SeasonManager } from "@/components/admin/SeasonManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

// Migrado de `tornear/app/admin/season.tsx`. La lógica entera vive en la RPC
// `transition_season` (SECURITY DEFINER, valida is_admin puertas adentro):
// acá sólo hay lectura de contexto y el formulario.
export default async function SeasonsPage() {
  // Guarda propia además de la del layout: en el App Router corren en
  // paralelo y sin esto la página consulta igual sin sesión (P2-12).
  await requireAdminAuth();

  const { active, history, error } = await fetchSeasons();

  return (
    <PageTransition>
      <PageHeader
        title="Temporadas"
        description="Cierre de la temporada activa y apertura de la siguiente."
      />

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudieron cargar las temporadas: {error}
        </p>
      ) : (
        <SeasonManager active={active} history={history} />
      )}
    </PageTransition>
  );
}
