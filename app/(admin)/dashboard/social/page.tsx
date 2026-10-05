import { requireAdminAuth } from "@/lib/admin-guard";

import {
  fetchSocialAccounts,
  fetchSocialTimeseries,
  firstKnownFollowers,
  isSocialPlatform,
  latestKnownFollowers,
  PLATFORM_LABELS,
  SOCIAL_PLATFORMS,
  sumNullable,
  type SocialMetricPoint,
  type SocialPlatform,
} from "@/lib/social-data";
import {
  fetchInstagramInsights,
  fetchInstagramPosts,
  rate,
  totalsOf,
  type InstagramDay,
  type InstagramPost,
  type Result,
} from "@/lib/instagram-insights-data";
import { fetchLinkClicks, type LinkClicksRow } from "@/lib/analytics-data";
import { formatRangeLabel, resolveDateRange } from "@/lib/date-range";
import { StatCard } from "@/components/charts/StatCard";
import { formatDay } from "@/components/charts/chart-theme";
import { SocialGrowthChart } from "@/components/charts/SocialGrowthChart";
import { InstagramProfileChart, InstagramReachChart } from "@/components/charts/InstagramDailyCharts";
import { InstagramFunnel } from "@/components/admin/InstagramFunnel";
import { InstagramPostsTable } from "@/components/admin/InstagramPostsTable";
import { SocialSnapshotForm } from "@/components/admin/SocialSnapshotForm";
import { InstagramConnectionCard } from "@/components/admin/InstagramConnectionCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { SegmentedFilter } from "@/components/ui/SegmentedFilter";
import { StatBoard } from "@/components/ui/Scoreboard";

const PLATFORM_OPTIONS = SOCIAL_PLATFORMS.map((platform) => ({
  value: platform,
  label: PLATFORM_LABELS[platform],
}));

export default async function SocialPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Guarda propia además de la del layout: en el App Router corren en
  // paralelo y sin esto la página consulta igual sin sesión (P2-12).
  await requireAdminAuth();

  const params = await searchParams;
  const range = resolveDateRange(params);

  const rawPlatform = Array.isArray(params.platform) ? params.platform[0] : params.platform;
  const platform: SocialPlatform = isSocialPlatform(rawPlatform) ? rawPlatform : "instagram";

  const isInstagram = platform === "instagram";
  const empty = <T,>(data: T): Promise<Result<T>> => Promise.resolve({ data, error: null });

  const [accountsResult, seriesResult, insightsResult, postsResult, clicksResult] = await Promise.all([
    fetchSocialAccounts(),
    fetchSocialTimeseries(platform, range),
    isInstagram ? fetchInstagramInsights(range) : empty<InstagramDay[]>([]),
    isInstagram ? fetchInstagramPosts(range) : empty<InstagramPost[]>([]),
    isInstagram ? fetchLinkClicks(range) : empty<LinkClicksRow[]>([]),
  ]);

  const currentFollowers = latestKnownFollowers(seriesResult.data);
  const startFollowers = firstKnownFollowers(seriesResult.data);
  const reachInRange = sumNullable(seriesResult.data, (d) => d.reach);
  const engagementsInRange = sumNullable(seriesResult.data, (d) => d.engagements);

  const account = accountsResult.data.find((a) => a.platform === platform && a.is_active);
  const instagramAccount = accountsResult.data.find((a) => a.platform === "instagram");

  // Con la cuenta conectada, Instagram muestra sus estadísticas (P2-8); las
  // demás plataformas siguen con el snapshot manual.
  const instagramConnected = isInstagram && instagramAccount?.access_token_secret_id != null;
  const totals = totalsOf(insightsResult.data);
  const igClicks = clicksResult.error
    ? null
    : (clicksResult.data.find((row) => row.channel === "ig")?.clicks ?? 0);
  const reachPerDay =
    totals.reach !== null && totals.daysWithData > 0 ? Math.round(totals.reach / totals.daysWithData) : null;

  const oauthStatus = Array.isArray(params.instagram) ? params.instagram[0] : params.instagram;
  const oauthReason = Array.isArray(params.reason) ? params.reason[0] : params.reason;

  return (
    <PageTransition>
      <PageHeader
        title="Redes"
        description={
          account
            ? `@${account.handle}, ${formatRangeLabel(range)}`
            : `Sin cuenta activa de ${PLATFORM_LABELS[platform]}, ${formatRangeLabel(range)}`
        }
        actions={
          <>
            <SegmentedFilter param="platform" options={PLATFORM_OPTIONS} active={platform} defaultValue="instagram" />
            <DateRangeFilter range={range} />
          </>
        }
      />

      {oauthStatus === "connected" ? (
        <p className="rounded-md border border-go/40 bg-go/10 p-4 text-[15px] text-chalk">
          Instagram conectado. Las estadísticas se cargan solas todos los días a las 06:00 (hora argentina).
        </p>
      ) : oauthStatus === "error" ? (
        <ErrorBox
          context="la conexión con Instagram"
          message={oauthReason ?? "Error desconocido. Probá conectar de nuevo."}
        />
      ) : null}

      {platform === "instagram" && instagramAccount ? (
        <InstagramConnectionCard account={instagramAccount} />
      ) : null}

      {instagramConnected ? (
        <InstagramSection
          followers={currentFollowers}
          startFollowers={startFollowers}
          series={seriesResult}
          insights={insightsResult}
          posts={postsResult}
          totals={totals}
          reachPerDay={reachPerDay}
          igClicks={igClicks}
        />
      ) : seriesResult.error ? (
        <ErrorBox context="las métricas de redes" message={seriesResult.error} />
      ) : (
        <>
          <StatBoard
            hero={
              <StatCard
                size="hero"
                label="Seguidores"
                value={currentFollowers}
                hint="último dato cargado"
                delta={
                  currentFollowers !== null && startFollowers !== null
                    ? { previous: startFollowers }
                    : undefined
                }
              />
            }
          >
            <StatCard
              label="Alcance del período"
              value={reachInRange}
              hint={reachInRange === null ? "sin carga en este rango" : `${range.days} días`}
            />
            <StatCard
              label="Interacciones del período"
              value={engagementsInRange}
              hint={engagementsInRange === null ? "sin carga en este rango" : `${range.days} días`}
            />
          </StatBoard>

          <section>
            <h2 className="chalk-rule mb-4">
              Seguidores por día
            </h2>
            <SocialGrowthChart data={seriesResult.data} />
          </section>
        </>
      )}

      {/* Instagram conectado se carga solo: el snapshot manual pisaría la fila
          que escribe instagram-sync. */}
      {instagramConnected ? null : (
        <section>
          <h2 className="chalk-rule mb-4">
            Cargar snapshot
          </h2>
          {accountsResult.error ? (
            <ErrorBox context="las cuentas configuradas" message={accountsResult.error} />
          ) : (
            <SocialSnapshotForm accounts={accountsResult.data} defaultPlatform={platform} />
          )}
        </section>
      )}
    </PageTransition>
  );
}

function InstagramSection({
  followers,
  startFollowers,
  series,
  insights,
  posts,
  totals,
  reachPerDay,
  igClicks,
}: {
  followers: number | null;
  startFollowers: number | null;
  series: Result<SocialMetricPoint[]>;
  insights: Result<InstagramDay[]>;
  posts: Result<InstagramPost[]>;
  totals: ReturnType<typeof totalsOf>;
  reachPerDay: number | null;
  igClicks: number | null;
}) {
  const lastDay = [...insights.data].reverse().find((d) => d.views !== null || d.reach !== null)?.day;
  const periodHint = lastDay ? `hasta el ${formatDay(lastDay)}` : "sin dato en este rango";
  const tapRate = rate(totals.website_clicks, totals.profile_views);

  return (
    <>
      <p className="text-sm text-chalk-faint">
        Estadísticas hasta ayer: se cargan solas todos los días a las 06:00 (hora argentina).
      </p>

      {insights.error ? <ErrorBox context="las estadísticas de Instagram" message={insights.error} /> : null}

      <StatBoard
        hero={
          <StatCard
            size="hero"
            label="Seguidores"
            value={followers}
            hint="último dato"
            delta={followers !== null && startFollowers !== null ? { previous: startFollowers } : undefined}
          />
        }
      >
        <StatCard label="Vistas" value={totals.views} hint={periodHint} />
        <StatCard label="Visitas al perfil" value={totals.profile_views} hint={periodHint} />
        <StatCard
          label="Toques en el link"
          value={totals.website_clicks}
          hint={tapRate === null ? periodHint : `${tapRate.toLocaleString("es-AR")} % de las visitas al perfil`}
        />
        <StatCard label="Interacciones" value={totals.total_interactions} hint="me gusta, comentarios, compartidos…" />
        <StatCard label="Compartidos" value={totals.shares} hint={periodHint} />
        <StatCard label="Cuentas alcanzadas" value={reachPerDay} hint="promedio por día" />
      </StatBoard>

      <section aria-labelledby="ig-funnel">
        <h2 id="ig-funnel" className="chalk-rule mb-4">
          Del contenido a la App Store
        </h2>
        <InstagramFunnel
          steps={[
            { label: "Vistas", value: totals.views, source: "Instagram: reproducciones de posts, reels e historias" },
            { label: "Visitas al perfil", value: totals.profile_views, source: "Instagram" },
            { label: "Toques en el link", value: totals.website_clicks, source: "Instagram: el link de la bio" },
            {
              label: "Clicks registrados en /d/ig",
              value: igClicks,
              source: "torneAR: llegan a la App Store (o a la web en Android). Las descargas, en App Store Connect",
            },
          ]}
        />
      </section>

      <section aria-labelledby="ig-reach">
        <h2 id="ig-reach" className="chalk-rule mb-4">
          Vistas y cuentas alcanzadas por día
        </h2>
        <InstagramReachChart data={insights.data} />
      </section>

      <section aria-labelledby="ig-profile">
        <h2 id="ig-profile" className="chalk-rule mb-4">
          Visitas al perfil y toques en el link por día
        </h2>
        <InstagramProfileChart data={insights.data} />
      </section>

      <section aria-labelledby="ig-posts">
        <h2 id="ig-posts" className="chalk-rule mb-4">
          Publicaciones del período
        </h2>
        {posts.error ? (
          <ErrorBox context="las publicaciones" message={posts.error} />
        ) : (
          <InstagramPostsTable posts={posts.data} />
        )}
      </section>

      <section aria-labelledby="ig-followers">
        <h2 id="ig-followers" className="chalk-rule mb-4">
          Seguidores por día
        </h2>
        {series.error ? (
          <ErrorBox context="los seguidores" message={series.error} />
        ) : (
          <SocialGrowthChart data={series.data} />
        )}
      </section>
    </>
  );
}

function ErrorBox({ context, message }: { context: string; message: string }) {
  return (
    <p className="rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
      No se pudo cargar {context}: {message}
    </p>
  );
}
