import { Award, Send, Share2, TrendingUp, UserPlus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/charts/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Panel de Viralidad.
 *
 * Dejó de ser un empty-state estático: ahora consulta de verdad. Mientras el
 * sistema de referidos no se use, los KPIs muestran ceros reales y el ranking
 * su propio vacío — que es distinto de un placeholder, porque el día que
 * aparezca el primer referido el panel se llena solo, sin tocar código.
 */
export default async function ViralPage() {
  const supabase = await createClient();

  const [summaryResult, referrersResult, sharesResult] = await Promise.all([
    supabase.rpc("dashboard_referral_summary").maybeSingle(),
    supabase.rpc("dashboard_top_referrers", { p_limit: 10 }),
    supabase.rpc("dashboard_share_summary"),
  ]);

  const summary = summaryResult.data;
  const referrers = referrersResult.data ?? [];
  const shares = buildShareTable(sharesResult.data ?? []);

  return (
    <PageTransition>
      <PageHeader
        title="Viralidad"
        description="Referidos, embajadores y cuánto crece torneAR por recomendación."
      />

      {summaryResult.error ? (
        <ErrorBox context="el resumen de viralidad" message={summaryResult.error.message} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Usuarios referidos"
            value={summary?.referred_count ?? 0}
            hint={`de ${(summary?.total_profiles ?? 0).toLocaleString("es-AR")} en total`}
            icon={UserPlus}
            tone={(summary?.referred_count ?? 0) > 0 ? "positive" : "neutral"}
          />
          <StatCard
            label="Tasa de referidos"
            value={
              summary?.referral_rate === null || summary?.referral_rate === undefined
                ? null
                : `${summary.referral_rate}%`
            }
            hint="del total de altas"
            icon={TrendingUp}
          />
          {/*
            Referidores distintos no es lo mismo que referidos, y la diferencia
            es el dato: un solo embajador muy activo infla el primer número y
            deja éste en 1. Es lo que dice si el canal se sostiene solo o
            depende de una persona.
          */}
          <StatCard
            label="Referidores distintos"
            value={summary?.referrer_count ?? 0}
            hint="personas que trajeron al menos a alguien"
            icon={Share2}
          />
          <StatCard
            label="Embajadores"
            value={summary?.ambassador_count ?? 0}
            hint="con la insignia otorgada"
            icon={Award}
          />
        </div>
      )}

      <section>
        <h2 className="font-display mb-1 text-lg uppercase text-neutral-on-surface">
          Compartidos
        </h2>
        {/*
          Es INTENCIÓN, no alcance: cuenta toques en "compartir", no Stories
          publicadas ni links abiertos — Meta y el sistema no devuelven eso. Ver
          lib/share-analytics.ts de la app.
        */}
        <p className="mb-3 text-sm text-neutral-on-surface-variant">
          Intentos de compartir desde la app. El destino exacto sólo lo informa iOS.
        </p>

        {sharesResult.error ? (
          <ErrorBox context="los compartidos" message={sharesResult.error.message} />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard
                label="Últimos 7 días"
                value={shares.total7}
                hint={`${shares.sharers7} ${shares.sharers7 === 1 ? "persona" : "personas"}`}
                icon={Send}
                tone={shares.total7 > 0 ? "positive" : "neutral"}
              />
              <StatCard
                label="Últimos 28 días"
                value={shares.total28}
                hint={`${shares.sharers28} ${shares.sharers28 === 1 ? "persona" : "personas"}`}
                icon={Send}
              />
            </div>

            {shares.rows.length === 0 ? (
              <EmptyState
                icon={Send}
                tone="neutral"
                title="Sin compartidos en los últimos 28 días"
                description="Se llena solo cuando alguien comparte un resultado, su invitación o el código de su equipo."
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
                <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
                      <th className="px-4 py-2 font-medium">Qué</th>
                      <th className="px-4 py-2 font-medium">Destino</th>
                      <th className="px-4 py-2 text-right font-medium">7 días</th>
                      <th className="px-4 py-2 text-right font-medium">28 días</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shares.rows.map((row) => (
                      <tr
                        key={`${row.contentType}|${row.destination}`}
                        className="border-b border-neutral-outline-variant last:border-0"
                      >
                        <td className="px-4 py-2.5 text-neutral-on-surface">
                          {CONTENT_TYPE_LABEL[row.contentType] ?? row.contentType}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-on-surface-variant">
                          {destinationLabel(row.destination)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-brand-primary">
                          {row.count7}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-neutral-on-surface">
                          {row.count28}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="font-display mb-3 text-lg uppercase text-neutral-on-surface">
          Top embajadores
        </h2>

        {referrersResult.error ? (
          <ErrorBox context="el ranking de embajadores" message={referrersResult.error.message} />
        ) : referrers.length === 0 ? (
          <EmptyState
            icon={Share2}
            tone="neutral"
            title="Sin referidos todavía"
            description="Este ranking se llena solo cuando el primer usuario invite a otro. No hace falta tocar nada."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
                  <th className="w-12 px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Usuario</th>
                  <th className="px-4 py-2 font-medium">Referidos</th>
                  <th className="px-4 py-2 font-medium">Insignia</th>
                </tr>
              </thead>
              <tbody>
                {referrers.map((referrer, index) => (
                  <tr
                    key={referrer.profile_id}
                    className="border-b border-neutral-outline-variant last:border-0"
                  >
                    <td className="px-4 py-2.5 tabular-nums text-neutral-outline">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-neutral-on-surface">{referrer.full_name}</span>{" "}
                      <span className="text-neutral-on-surface-variant">
                        @{referrer.username}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-brand-primary">
                      {referrer.referred_count}
                    </td>
                    <td className="px-4 py-2.5">
                      {referrer.is_ambassador ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold/15 px-2 py-0.5 text-[11px] font-semibold text-brand-gold">
                          <Award className="size-3" aria-hidden="true" />
                          Embajador
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-outline">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageTransition>
  );
}

// ─── Compartidos ─────────────────────────────────────────────────────────────

/** Espeja `ShareContentType` de la app (lib/share-analytics.ts). */
const CONTENT_TYPE_LABEL: Record<string, string> = {
  match: "Tarjeta de partido",
  referral: "Invitación del perfil",
  team_invite: "Código de equipo",
  desconocido: "Sin tipo",
};

/**
 * Destinos sintéticos que arma la RPC cuando la plataforma no informa uno, y
 * los `activityType` de iOS más probables. Un bundle id que no esté acá se
 * muestra tal cual: es preferible ver `com.algo.ShareExtension` que perderlo.
 */
const DESTINATION_LABEL: Record<string, string> = {
  instagram_stories: "Instagram Stories",
  menu_sistema: "Menú del sistema (sin detalle)",
  sin_destino: "Sin destino (Android o cancelado)",
  "net.whatsapp.WhatsApp.ShareExtension": "WhatsApp",
  "net.whatsapp.WhatsAppSMB.ShareExtension": "WhatsApp Business",
  "com.burbn.instagram.shareextension": "Instagram",
  "com.apple.UIKit.activity.Message": "Mensajes",
  "com.apple.UIKit.activity.CopyToPasteboard": "Copiado",
  "com.apple.UIKit.activity.Mail": "Mail",
  "com.apple.UIKit.activity.AirDrop": "AirDrop",
  "com.facebook.Messenger.ShareExtension": "Messenger",
  "ph.telegra.Telegraph.Share": "Telegram",
  "com.atebits.Tweetie2.ShareExtension": "X",
};

function destinationLabel(destination: string): string {
  return DESTINATION_LABEL[destination] ?? destination;
}

type ShareSummaryRow = {
  window_days: number;
  content_type: string;
  destination: string;
  share_count: number;
  sharer_count: number;
};

/**
 * Pasa las filas de la RPC (una por ventana × tipo × destino) a una fila por
 * tipo × destino con las dos ventanas lado a lado.
 *
 * Los totales de personas salen de la RPC y no de sumar `sharer_count` entre
 * filas: la misma persona que comparte a WhatsApp y a Mensajes aparece en dos
 * filas, y sumarlas la contaría dos veces. Se usa el máximo por ventana como
 * cota inferior honesta; el número exacto de personas distintas por ventana
 * necesitaría otra agregación, y con este volumen no cambia la lectura.
 */
function buildShareTable(data: ShareSummaryRow[]) {
  const byKey = new Map<string, { contentType: string; destination: string; count7: number; count28: number }>();
  let total7 = 0;
  let total28 = 0;
  let sharers7 = 0;
  let sharers28 = 0;

  for (const row of data) {
    const key = `${row.content_type}|${row.destination}`;
    const entry = byKey.get(key) ?? {
      contentType: row.content_type,
      destination: row.destination,
      count7: 0,
      count28: 0,
    };

    if (row.window_days === 7) {
      entry.count7 = row.share_count;
      total7 += row.share_count;
      sharers7 = Math.max(sharers7, row.sharer_count);
    } else if (row.window_days === 28) {
      entry.count28 = row.share_count;
      total28 += row.share_count;
      sharers28 = Math.max(sharers28, row.sharer_count);
    }

    byKey.set(key, entry);
  }

  const rows = [...byKey.values()].sort((a, b) => b.count28 - a.count28 || b.count7 - a.count7);
  return { rows, total7, total28, sharers7, sharers28 };
}

function ErrorBox({ context, message }: { context: string; message: string }) {
  return (
    <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
      No se pudo cargar {context}: {message}
    </p>
  );
}
