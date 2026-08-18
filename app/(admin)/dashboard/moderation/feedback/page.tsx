import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// app_feedback no tiene policy de SELECT, ni para admin (§3.3 de
// WEB_SPECIFICATION.md) — la única vía de lectura es este RPC
// SECURITY DEFINER, nunca una query directa a la tabla.
export default async function FeedbackInboxPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("dashboard_feedback_inbox", {
    limit_val: 50,
    offset_val: 0,
  });

  const feedback = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase text-neutral-on-surface">
            Feedback
          </h1>
          <p className="text-sm text-neutral-on-surface-variant">
            Sugerencias y reportes de bug enviados desde la app.
          </p>
        </div>
        <Link
          href="/dashboard/moderation"
          className="rounded-md border border-neutral-outline px-3 py-2 text-sm font-semibold text-neutral-on-surface transition hover:bg-surface-container"
        >
          ← Denuncias
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudo cargar el feedback: {error.message}
        </p>
      ) : feedback.length === 0 ? (
        <p className="rounded-lg border border-neutral-outline-variant bg-surface-container p-8 text-center text-neutral-on-surface-variant">
          No hay feedback todavía.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {feedback.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-neutral-outline-variant bg-surface-container p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
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
      )}
    </div>
  );
}
