import type { LinkClicksRow } from "@/lib/analytics-data";

/** Nombre de cada canal de la campaña. La lista vive en app/d/[canal]/route.ts. */
const CHANNEL_LABELS: Record<string, string> = {
  dm: "Mensaje directo",
  wpp: "WhatsApp",
  story: "Historia de Instagram",
  cancha: "Cancha (QR o cartel)",
};

const LINK_BASE = "tornear.vercel.app/d/";

/**
 * Clicks en los links de descarga por canal (#37). Es el embudo de este lado;
 * las descargas y primeras aperturas por canal están en App Store Connect →
 * Analytics → Campañas (Apple las muestra con al menos 5 instalaciones).
 */
export function LinkClicksTable({ rows }: { rows: LinkClicksRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
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
            <tr key={row.channel} className="border-b border-neutral-outline-variant last:border-0">
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
