"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SignupsTimeseriesRow {
  day: string;
  signups: number;
}

// Mismo hex que --brand-primary en app/globals.css — ver nota de
// LogsChart.tsx sobre por qué se hardcodea en vez de usar var(--color-*).
const BRAND_PRIMARY = "#53e076";

function formatDay(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

export function GrowthChart({ data }: { data: SignupsTimeseriesRow[] }) {
  const hasSignups = data.some((d) => d.signups > 0);

  if (!hasSignups) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
        Sin altas en este período.
      </div>
    );
  }

  return (
    <div className="h-72 rounded-lg border border-neutral-outline-variant bg-surface-container p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3d4a3d" vertical={false} />
          <XAxis dataKey="day" tickFormatter={formatDay} stroke="#bccbb9" fontSize={12} tickLine={false} />
          <YAxis allowDecimals={false} stroke="#bccbb9" fontSize={12} tickLine={false} width={32} />
          <Tooltip
            labelFormatter={(value) => formatDay(String(value))}
            formatter={(value) => [value, "Altas"]}
            contentStyle={{
              background: "#201f1f",
              border: "1px solid #3d4a3d",
              borderRadius: 8,
              color: "#e5e2e1",
              fontSize: 13,
            }}
          />
          <Line
            type="monotone"
            dataKey="signups"
            stroke={BRAND_PRIMARY}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
