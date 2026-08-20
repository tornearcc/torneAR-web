"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_PROPS, CHART_COLORS, GRID_PROPS } from "./chart-theme";
import { ChartTooltip } from "./ChartTooltip";

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

const STATUS_COLOR: Record<string, string> = {
  PENDIENTE: CHART_COLORS.warn,
  CONFIRMADO: CHART_COLORS.info,
  EN_VIVO: CHART_COLORS.brandPrimary,
  FINALIZADO: CHART_COLORS.outline,
  EN_DISPUTA: CHART_COLORS.error,
  WO_A: CHART_COLORS.alertOrange,
  WO_B: CHART_COLORS.alertOrange,
  CANCELADO: CHART_COLORS.outlineVariant,
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
          <CartesianGrid {...GRID_PROPS} horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
          <YAxis
            type="category"
            dataKey="status"
            tickFormatter={(value) => STATUS_LABEL[value] ?? value}
            width={100}
            {...AXIS_PROPS}
          />
          <Tooltip
            cursor={{ fill: CHART_COLORS.surfaceHigh, fillOpacity: 0.45 }}
            content={
              <ChartTooltip
                labelFormatter={(value) => STATUS_LABEL[String(value)] ?? String(value)}
                nameFormatter={() => "Partidos"}
              />
            }
          />
          <Bar dataKey="matches_count" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? CHART_COLORS.outline} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
