"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, formatDay } from "./chart-theme";
import { ChartTooltip } from "./ChartTooltip";
import { ChartEmpty } from "./ChartEmpty";

export interface GrowthPointRow {
  day: string;
  signups: number;
  teams: number;
}

const SERIES_NAME: Record<string, string> = {
  signups: "Usuarios",
  teams: "Equipos",
};

/**
 * Altas de usuarios y equipos en el mismo eje.
 *
 * Las dos series comparten eje Y aunque estén en órdenes de magnitud
 * distintos (decenas de usuarios contra unidades de equipos). Es deliberado:
 * un eje derecho independiente haría parecer que un equipo nuevo "vale" lo
 * mismo que veinte altas. Con un eje común la proporción real se lee sola, y
 * el área de equipos queda encima para que no desaparezca bajo la otra.
 */
export function GrowthChart({ data }: { data: GrowthPointRow[] }) {
  const hasData = data.some((d) => d.signups > 0 || d.teams > 0);

  if (!hasData) {
    return <ChartEmpty message="Sin altas en este período." />;
  }

  return (
    <div className="h-72 rounded-lg border border-neutral-outline-variant bg-surface-container p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="growth-signups" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.brandPrimary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.brandPrimary} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="growth-teams" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.info} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.info} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis dataKey="day" tickFormatter={formatDay} {...AXIS_PROPS} />
          <YAxis allowDecimals={false} width={32} {...AXIS_PROPS} />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.outline, strokeDasharray: "3 3" }}
            content={
              <ChartTooltip
                labelFormatter={(value) => formatDay(String(value))}
                nameFormatter={(name) => SERIES_NAME[name] ?? name}
              />
            }
          />
          <Legend
            formatter={(value) => SERIES_NAME[value] ?? value}
            wrapperStyle={{ fontSize: 12, color: CHART_COLORS.onSurfaceVariant }}
          />
          <Area
            type="monotone"
            dataKey="signups"
            stroke={CHART_COLORS.brandPrimary}
            strokeWidth={2}
            fill="url(#growth-signups)"
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="teams"
            stroke={CHART_COLORS.info}
            strokeWidth={2}
            fill="url(#growth-teams)"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
