"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, formatDay } from "./chart-theme";
import { ChartTooltip } from "./ChartTooltip";
import { ChartEmpty } from "./ChartEmpty";

export interface ActivityPointRow {
  day: string;
  matches_created: number;
  matches_scheduled: number;
  matches_finished: number;
}

const SERIES_NAME: Record<string, string> = {
  matches_created: "Creados",
  matches_scheduled: "Agendados",
  matches_finished: "Finalizados",
};

/**
 * Ciclo de vida del partido, día a día.
 *
 * Barras para creados/agendados y línea para finalizados: las dos primeras son
 * intención (alguien armó o programó un partido) y la tercera es el resultado.
 * Con tres barras iguales habría que leer la leyenda para saber cuál es cuál;
 * separando la forma se ve de un vistazo cuánto de lo que se agenda termina
 * jugándose.
 */
export function ActivityTimeseriesChart({ data }: { data: ActivityPointRow[] }) {
  const hasData = data.some(
    (d) => d.matches_created > 0 || d.matches_scheduled > 0 || d.matches_finished > 0,
  );

  if (!hasData) {
    return <ChartEmpty message="Sin actividad de partidos en este período." />;
  }

  return (
    <div className="h-72 rounded-lg border border-neutral-outline-variant bg-surface-container p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis dataKey="day" tickFormatter={formatDay} {...AXIS_PROPS} />
          <YAxis allowDecimals={false} width={32} {...AXIS_PROPS} />
          <Tooltip
            cursor={{ fill: CHART_COLORS.surfaceHigh, fillOpacity: 0.45 }}
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
          <Bar dataKey="matches_created" fill={CHART_COLORS.info} radius={[3, 3, 0, 0]} />
          <Bar
            dataKey="matches_scheduled"
            fill={CHART_COLORS.warn}
            radius={[3, 3, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="matches_finished"
            stroke={CHART_COLORS.brandPrimary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
