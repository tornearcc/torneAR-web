import { requireAdminAuth } from "@/lib/admin-guard";
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
  // El layout también exige admin, pero en el App Router layout y página se
  // renderizan en paralelo: sin esta guarda, la consulta corre igual sin sesión
  // (el 28/09 la respuesta sin login llevaba «No se pudieron cargar…»).
  await requireAdminAuth();

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
        <p className="rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
          No se pudieron cargar los equipos: {result.error}
        </p>
      ) : (
        <TeamsTable teams={result.rows} zones={result.zones} />
      )}
    </PageTransition>
  );
}
