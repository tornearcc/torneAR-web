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
  type SocialPlatform,
} from "@/lib/social-data";
import { formatRangeLabel, resolveDateRange } from "@/lib/date-range";
import { StatCard } from "@/components/charts/StatCard";
import { SocialGrowthChart } from "@/components/charts/SocialGrowthChart";
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

  const [accountsResult, seriesResult] = await Promise.all([
    fetchSocialAccounts(),
    fetchSocialTimeseries(platform, range),
  ]);

  const currentFollowers = latestKnownFollowers(seriesResult.data);
  const startFollowers = firstKnownFollowers(seriesResult.data);
  const reachInRange = sumNullable(seriesResult.data, (d) => d.reach);
  const engagementsInRange = sumNullable(seriesResult.data, (d) => d.engagements);

  const account = accountsResult.data.find((a) => a.platform === platform && a.is_active);
  const instagramAccount = accountsResult.data.find((a) => a.platform === "instagram");

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
          Instagram conectado. El primer sync automático corre con el próximo cron diario (09:00 UTC).
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

      {seriesResult.error ? (
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
    </PageTransition>
  );
}

function ErrorBox({ context, message }: { context: string; message: string }) {
  return (
    <p className="rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
      No se pudo cargar {context}: {message}
    </p>
  );
}
