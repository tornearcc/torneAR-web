"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface LogsByLevelRow {
  day: string;
  info_count: number;
  warn_count: number;
  error_count: number;
}

// Mismos hex que app/globals.css (--info-secondary, --warning-tertiary,
// --danger-error). Recharts dibuja en SVG plano y no resuelve custom
// properties de forma consistente en el sitio de render, así que se
// hardcodean acá en vez de leer var(--color-*).
const COLORS = {
  info: "#8ccdff",
  warn: "#fabd32",
  error: "#ffb4ab",
} as const;

const LEVEL_NAME: Record<string, string> = {
  info_count: "Info",
  warn_count: "Warn",
  error_count: "Error",
};

function formatDay(value: string) {
  // `value` llega como "YYYY-MM-DD" (tipo `date` de Postgres serializado
  // por PostgREST) — se ancla a UTC para no correr un día según la zona
  // horaria del navegador que renderiza.
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

export function LogsChart({ data }: { data: LogsByLevelRow[] }) {
  const hasLogs = data.some((d) => d.info_count + d.warn_count + d.error_count > 0);

  if (!hasLogs) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
        Sin logs en este período.
      </div>
    );
  }

  return (
    <div className="h-72 rounded-lg border border-neutral-outline-variant bg-surface-container p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3d4a3d" vertical={false} />
          <XAxis dataKey="day" tickFormatter={formatDay} stroke="#bccbb9" fontSize={12} tickLine={false} />
          <YAxis allowDecimals={false} stroke="#bccbb9" fontSize={12} tickLine={false} width={32} />
          <Tooltip
            labelFormatter={(value) => formatDay(String(value))}
            formatter={(value, name) => [value, LEVEL_NAME[String(name)] ?? String(name)]}
            contentStyle={{
              background: "#201f1f",
              border: "1px solid #3d4a3d",
              borderRadius: 8,
              color: "#e5e2e1",
              fontSize: 13,
            }}
          />
          <Legend formatter={(value) => LEVEL_NAME[value] ?? value} wrapperStyle={{ fontSize: 12, color: "#bccbb9" }} />
          <Bar dataKey="info_count" stackId="logs" fill={COLORS.info} />
          <Bar dataKey="warn_count" stackId="logs" fill={COLORS.warn} />
          <Bar dataKey="error_count" stackId="logs" fill={COLORS.error} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
