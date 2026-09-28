import { fetchTeamsPage, resolveTeamSearch } from "@/lib/teams-data";
import { TeamsTable } from "@/components/admin/TeamsTable";
import { TeamsToolbar } from "@/components/admin/TeamsToolbar";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const search = resolveTeamSearch(await searchParams);
  const result = await fetchTeamsPage(search);

  return (
    <PageTransition className="gap-6">
      <PageHeader
        title="Equipos"
        description={
          result.error
            ? "Zonas y excepciones al candado de zona."
            : `${result.rows.length.toLocaleString("es-AR")} ${result.rows.length === 1 ? "equipo" : "equipos"}. Un equipo cambia de zona una vez por temporada${result.seasonName ? ` (${result.seasonName})` : ""}; acá se hacen las excepciones.`
        }
      />

      <TeamsToolbar search={search} />

      {result.error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudieron cargar los equipos: {result.error}
        </p>
      ) : (
        <TeamsTable teams={result.rows} zones={result.zones} />
      )}
    </PageTransition>
  );
}
