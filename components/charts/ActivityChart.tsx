"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface MatchesByStatusRow {
  status: string;
  matches_count: number;
}

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_VIVO: "En vivo",
  FINALIZADO: "Finalizado",
  EN_DISPUTA: "En disputa",
  WO_A: "W.O. equipo A",
  WO_B: "W.O. equipo B",
  CANCELADO: "Cancelado",
};

// Mismos hex que app/globals.css — ver nota de LogsChart.tsx.
const STATUS_COLOR: Record<string, string> = {
  PENDIENTE: "#fabd32", // warning-tertiary
  CONFIRMADO: "#8ccdff", // info-secondary
  EN_VIVO: "#53e076", // brand-primary
  FINALIZADO: "#869585", // neutral-outline
  EN_DISPUTA: "#ffb4ab", // danger-error
  WO_A: "#e8821a", // danger-alert-orange
  WO_B: "#e8821a",
  CANCELADO: "#3d4a3d", // neutral-outline-variant
};

export function ActivityChart({ data }: { data: MatchesByStatusRow[] }) {
  const hasMatches = data.some((d) => d.matches_count > 0);

  if (!hasMatches) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
        Sin partidos todavía.
      </div>
    );
  }

  return (
    <div className="h-80 rounded-lg border border-neutral-outline-variant bg-surface-container p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3d4a3d" horizontal={false} />
          <XAxis type="number" allowDecimals={false} stroke="#bccbb9" fontSize={12} tickLine={false} />
          <YAxis
            type="category"
            dataKey="status"
            tickFormatter={(value) => STATUS_LABEL[value] ?? value}
            stroke="#bccbb9"
            fontSize={12}
            tickLine={false}
            width={100}
          />
          <Tooltip
            formatter={(value) => [value, "Partidos"]}
            labelFormatter={(value) => STATUS_LABEL[String(value)] ?? String(value)}
            contentStyle={{
              background: "#201f1f",
              border: "1px solid #3d4a3d",
              borderRadius: 8,
              color: "#e5e2e1",
              fontSize: 13,
            }}
          />
          <Bar dataKey="matches_count">
            {data.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? "#869585"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
