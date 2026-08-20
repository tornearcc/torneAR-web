import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";

const PAGE_SIZE = 25;

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function resolvePage(value: string | string[] | undefined): number {
  const raw = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
}

// app_feedback no tiene policy de SELECT, ni para admin (§3.3 de
// WEB_SPECIFICATION.md) — la única vía de lectura es este RPC SECURITY
// DEFINER, nunca una query directa a la tabla.
export default async function FeedbackInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = resolvePage(params.page);

  const supabase = await createClient();

  // Se pide una fila de más para saber si hay página siguiente sin un COUNT:
  // la RPC no devuelve total, y agregarle uno era más cambio de base del que
  // justifica una bandeja que hoy está vacía. Con `limit + 1`, si vuelve esa
  // fila extra es que hay más — se descarta antes de renderizar.
  const { data, error } = await supabase.rpc("dashboard_feedback_inbox", {
    limit_val: PAGE_SIZE + 1,
    offset_val: (page - 1) * PAGE_SIZE,
  });

  const rows = data ?? [];
  const hasNext = rows.length > PAGE_SIZE;
  const feedback = hasNext ? rows.slice(0, PAGE_SIZE) : rows;

  return (
    <PageTransition className="gap-6">
      <PageHeader
        title="Feedback"
        description="Sugerencias y reportes de bug enviados desde la app."
        actions={
          <Link
            href="/dashboard/moderation"
            className="rounded-md border border-neutral-outline px-3 py-2 text-sm font-semibold text-neutral-on-surface transition hover:bg-surface-container"
          >
            ← Denuncias
          </Link>
        }
      />

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudo cargar el feedback: {error.message}
        </p>
      ) : feedback.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          tone="neutral"
          title="Sin feedback"
          description={
            page > 1
              ? "No hay más mensajes en esta página."
              : "Todavía nadie envió sugerencias ni reportes desde la app."
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {feedback.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-neutral-outline-variant bg-surface-container p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-neutral-on-surface">
                      {item.full_name}
                    </span>
                    <span className="text-sm text-neutral-on-surface-variant">
                      @{item.username}
                    </span>
                  </div>
                  <time
                    dateTime={item.created_at}
                    className="shrink-0 text-xs text-neutral-on-surface-variant"
                  >
                    {DATE_FORMATTER.format(new Date(item.created_at))}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-on-surface">
                  {item.message}
                </p>
              </li>
            ))}
          </ul>

          {/* Paginador propio y no el componente `Pagination`: ése necesita el
              total de filas para calcular la última página, y acá no lo hay. */}
          {(page > 1 || hasNext) && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-neutral-on-surface-variant">Página {page}</p>
              <div className="flex gap-2">
                <PageLink page={page - 1} disabled={page <= 1} label="← Anterior" />
                <PageLink page={page + 1} disabled={!hasNext} label="Siguiente →" />
              </div>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}

function PageLink({
  page,
  disabled,
  label,
}: {
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-md border border-neutral-outline-variant px-3 py-1.5 text-xs text-neutral-outline opacity-40">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={page <= 1 ? "/dashboard/moderation/feedback" : `?page=${page}`}
      scroll={false}
      className="rounded-md border border-neutral-outline-variant px-3 py-1.5 text-xs text-neutral-on-surface-variant transition-colors hover:bg-surface-high hover:text-neutral-on-surface"
    >
      {label}
    </Link>
  );
}
