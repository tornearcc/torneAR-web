import { ExternalLink } from "lucide-react";

import { rate, type InstagramPost } from "@/lib/instagram-insights-data";

const TYPE_LABELS: Record<string, string> = {
  REELS: "Reel",
  FEED: "Post",
  STORY: "Historia",
};

function formatPostedAt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function count(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("es-AR");
}

/**
 * Publicaciones del período, de la más vista a la menos vista, con su último
 * snapshot (métricas acumuladas desde que se publicó).
 *
 * Dos columnas calculadas, las que sirven para elegir qué pautar:
 * - «Compartidos c/100»: compartidos cada 100 cuentas alcanzadas. Compartir
 *   es la señal más fuerte de que un video gusta afuera de los conocidos.
 * - «Vista prom.»: segundos que se mira un reel en promedio (sólo reels).
 *
 * La barra de vistas es relativa a la publicación más vista del período.
 */
export function InstagramPostsTable({ posts }: { posts: InstagramPost[] }) {
  if (posts.length === 0) {
    return (
      <p className="border-y border-dashed border-chalk-line py-10 text-center text-sm text-chalk-faint">
        No hay publicaciones en este período (se guardan las de los últimos 30 días desde que se conectó la cuenta).
      </p>
    );
  }

  const sorted = [...posts].sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
  const maxViews = Math.max(...sorted.map((p) => p.views ?? 0), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-chalk-line text-[13px] text-chalk-faint">
            <th className="px-3 py-3 font-medium">Publicación</th>
            <th className="w-[200px] px-3 py-3 font-medium">Vistas</th>
            <th className="px-3 py-3 text-right font-medium">Alcance</th>
            <th className="px-3 py-3 text-right font-medium">Me gusta</th>
            <th className="px-3 py-3 text-right font-medium">Coment.</th>
            <th className="px-3 py-3 text-right font-medium">Compart.</th>
            <th className="px-3 py-3 text-right font-medium">Guard.</th>
            <th className="px-3 py-3 text-right font-medium" title="Compartidos cada 100 cuentas alcanzadas">
              Compart. c/100
            </th>
            <th className="px-3 py-3 text-right font-medium" title="Segundos que se mira el reel en promedio">
              Vista prom.
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((post) => {
            const shareRate = rate(post.shares, post.reach);
            const caption = post.caption?.split("\n")[0]?.trim() || "Sin texto";

            return (
              <tr key={post.media_id} className="border-b border-chalk-line align-top">
                <td className="max-w-[280px] px-3 py-3">
                  <div className="flex items-center gap-2 text-xs text-chalk-faint">
                    <span className="tabular-nums">{formatPostedAt(post.posted_at)}</span>
                    <span className="rounded-full bg-surface-high px-2 py-0.5 font-semibold text-chalk-dim">
                      {TYPE_LABELS[post.media_type ?? ""] ?? post.media_type ?? "—"}
                    </span>
                  </div>
                  {post.permalink ? (
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 flex items-start gap-1 text-chalk hover:underline"
                    >
                      <span className="line-clamp-2">{caption}</span>
                      <ExternalLink className="mt-1 size-3 shrink-0 text-chalk-faint" aria-hidden="true" />
                    </a>
                  ) : (
                    <p className="mt-1 line-clamp-2 text-chalk">{caption}</p>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-high" aria-hidden="true">
                      <div
                        className="h-full rounded-full bg-chalk-dim"
                        style={{ width: `${((post.views ?? 0) / maxViews) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-semibold tabular-nums text-chalk">{count(post.views)}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-chalk-dim">{count(post.reach)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-chalk-dim">{count(post.likes)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-chalk-dim">{count(post.comments)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-chalk-dim">{count(post.shares)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-chalk-dim">{count(post.saved)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-chalk">
                  {shareRate === null ? "—" : shareRate.toLocaleString("es-AR")}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-chalk">
                  {post.avg_watch_ms === null
                    ? "—"
                    : `${(post.avg_watch_ms / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} s`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
