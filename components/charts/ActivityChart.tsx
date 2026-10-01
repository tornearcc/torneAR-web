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
  // Mismo código que el resto del dashboard: verde = en juego, amarilla =
  // espera una decisión. El resto sin color de estado.
  PENDIENTE: CHART_COLORS.outline,
  CONFIRMADO: CHART_COLORS.series1,
  EN_VIVO: CHART_COLORS.brandPrimary,
  FINALIZADO: CHART_COLORS.onSurfaceVariant,
  EN_DISPUTA: CHART_COLORS.warn,
  WO_A: CHART_COLORS.series2,
  WO_B: CHART_COLORS.series2,
  CANCELADO: CHART_COLORS.outlineVariant,
};

export function ActivityChart({ data }: { data: MatchesByStatusRow[] }) {
  const hasMatches = data.some((d) => d.matches_count > 0);

  if (!hasMatches) {
    return (
      <div className="flex h-64 items-center justify-center border-y border-dashed border-chalk-line text-sm text-chalk-faint">
        Sin partidos todavía.
      </div>
    );
  }

  return (
    <div className="h-80">
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
