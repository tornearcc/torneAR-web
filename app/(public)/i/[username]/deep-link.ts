/**
 * Arma `tornear://login?ref=<username>&utm_...` — el mismo destino que
 * `normalizeUniversalLink` construye del lado del móvil
 * (`tornear/lib/deep-linking.ts`) cuando el SO sí intercepta el Universal
 * Link. Acá hace falta un equivalente propio porque, si el SO NO lo
 * interceptó (falta el entitlement, o el navegador no lo intentó), esta
 * página cae como fallback y arma el mismo link a mano.
 *
 * Un solo helper para los dos call sites de esta carpeta (`page.tsx` y
 * `InstallRedirect.tsx`) — no se comparte con el móvil: son runtimes
 * distintos y la duplicación de esta única función es más barata que
 * publicar un paquete, mismo criterio que `lib/dispute-scores.ts`.
 */

export interface DeepLinkUtm {
  source: string | null;
  medium: string | null;
  campaign: string | null;
}

export function buildAppDeepLink(username: string, utm: DeepLinkUtm): string {
  const parts = [`ref=${encodeURIComponent(username)}`];

  if (utm.source) parts.push(`utm_source=${encodeURIComponent(utm.source)}`);
  if (utm.medium) parts.push(`utm_medium=${encodeURIComponent(utm.medium)}`);
  if (utm.campaign) parts.push(`utm_campaign=${encodeURIComponent(utm.campaign)}`);

  return `tornear://login?${parts.join("&")}`;
}

function firstParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || null;
}

/** Lee los 3 UTM de un objeto de `searchParams` de Next (ya resuelto). */
export function resolveUtmParams(params: {
  [key: string]: string | string[] | undefined;
}): DeepLinkUtm {
  return {
    source: firstParam(params.utm_source),
    medium: firstParam(params.utm_medium),
    campaign: firstParam(params.utm_campaign),
  };
}
