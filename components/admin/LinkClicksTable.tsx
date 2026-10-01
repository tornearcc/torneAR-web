import type { LinkClicksRow } from "@/lib/analytics-data";

/** Nombre de cada canal de la campaña. La lista vive en app/d/[canal]/route.ts. */
const CHANNEL_LABELS: Record<string, string> = {
  dm: "Mensaje directo",
  wpp: "WhatsApp",
  story: "Historia de Instagram",
  fb: "Grupos de Facebook",
  cancha: "Cancha (QR o cartel)",
  // No se reparte a mano: es el botón del App Store de la página de
  // invitación a un equipo (/i/<username>?e=<código>, Tanda 7).
  equipo: "Invitación a un equipo",
  x: "X / Twitter (bio de @tornear_app)",
  ig: "Instagram (bio de @tornear.app)",
  tiktok: "TikTok (bio de @tornear.app)",
};

const LINK_BASE = "tornear.vercel.app/d/";

/**
 * Clicks en los links de descarga por canal (#37). Es el embudo de este lado;
 * las descargas y primeras aperturas por canal están en App Store Connect →
 * Analytics → Campañas (Apple las muestra con al menos 5 instalaciones).
 */
export function LinkClicksTable({ rows }: { rows: LinkClicksRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-chalk-line text-[13px] text-chalk-faint">
            <th className="px-4 py-3 font-medium">Canal</th>
            <th className="px-4 py-3 font-medium">Link</th>
            <th className="px-4 py-3 text-right font-medium">Clicks</th>
            <th className="px-4 py-3 text-right font-medium">iPhone</th>
            <th className="px-4 py-3 text-right font-medium">Android</th>
            <th className="px-4 py-3 text-right font-medium">Otros</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.channel} className="border-b border-chalk-line">
              <td className="px-4 py-3 text-neutral-on-surface">
                {CHANNEL_LABELS[row.channel] ?? row.channel}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-neutral-on-surface-variant select-all">
                {LINK_BASE}
                {row.channel}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-neutral-on-surface">
                {row.clicks}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-neutral-on-surface-variant">{row.ios}</td>
              <td className="px-4 py-3 text-right tabular-nums text-neutral-on-surface-variant">{row.android}</td>
              <td className="px-4 py-3 text-right tabular-nums text-neutral-on-surface-variant">{row.otro}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
