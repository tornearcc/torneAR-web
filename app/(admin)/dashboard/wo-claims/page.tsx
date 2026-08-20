import { fetchPendingWoClaims, resolveWoEvidenceUrl } from "@/lib/admin-queues-data";
import { WoClaimsQueue, type WoClaimWithEvidence } from "@/components/admin/WoClaimsQueue";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

// Migrado de `tornear/app/admin/wo-review.tsx`.
export default async function WoClaimsPage() {
  const { claims, error } = await fetchPendingWoClaims();

  // Las URLs de evidencia se resuelven en el servidor y no en el cliente:
  // `getPublicUrl` necesita un cliente de Supabase, y crear uno en el browser
  // sólo para concatenar un string sería mandar la sesión a hacer trabajo de
  // template. No hay red acá — es construcción de string por reclamo.
  const claimsWithEvidence: WoClaimWithEvidence[] = await Promise.all(
    claims.map(async (claim) => ({
      ...claim,
      evidenceUrl: await resolveWoEvidenceUrl(claim.photoUrl),
    })),
  );

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
