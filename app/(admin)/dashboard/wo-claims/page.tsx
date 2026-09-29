import { requireAdminAuth } from "@/lib/admin-guard";
import { fetchPendingWoClaims, resolveWoEvidence } from "@/lib/admin-queues-data";
import { WoClaimsQueue, type WoClaimWithEvidence } from "@/components/admin/WoClaimsQueue";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

// Migrado de `tornear/app/admin/wo-review.tsx`, que se eliminó de la app (D-48):
// esta es la única cola de reclamos de WO.
export default async function WoClaimsPage() {
  // Guarda propia además de la del layout: en el App Router corren en
  // paralelo y sin esto la página consulta igual sin sesión (P2-12).
  await requireAdminAuth();

  const { claims, error } = await fetchPendingWoClaims();

  // Las evidencias se firman en el servidor, con la sesión del admin y en una
  // sola llamada para toda la cola. La página ya se renderiza por request, así
  // que cada recarga trae URLs vigentes.
  // La foto de la respuesta del acusado (D-61) va en la misma llamada.
  const evidence = await resolveWoEvidence([
    ...claims.map((claim) => claim.photoUrl),
    ...claims.map((claim) => claim.responsePhotoUrl),
  ]);
  const claimsWithEvidence: WoClaimWithEvidence[] = claims.map((claim, i) => ({
    ...claim,
    evidence: evidence[i],
    responseEvidence: evidence[claims.length + i],
  }));

  return (
    <PageTransition>
      <PageHeader
        title="Reclamos de WO"
        description={
          error
            ? "Cola de revisión de walkovers."
            : `${claims.length} reclamo${claims.length === 1 ? "" : "s"} pendiente${claims.length === 1 ? "" : "s"} de revisión.`
        }
      />

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudieron cargar los reclamos: {error}
        </p>
      ) : (
        <WoClaimsQueue claims={claimsWithEvidence} />
      )}
    </PageTransition>
  );
}
