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

import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, formatDay } from "./chart-theme";
import { ChartTooltip } from "./ChartTooltip";
import { ChartEmpty } from "./ChartEmpty";

export interface CheckinPointRow {
  day: string;
  participants: number;
  checkins: number;
}

const SERIES_NAME: Record<string, string> = {
  checkins: "Con check-in",
  no_show: "Sin check-in",
};

/**
 * Presentismo por día de partido.
 *
 * Las barras se apilan como "con check-in" + "sin check-in" en vez de
 * "convocados" y "check-ins" superpuestas. Es la misma información, pero
 * apilada el alto total sigue siendo el plantel convocado y la proporción de
 * ausentes se lee como una fracción de esa barra — que es la pregunta real.
 * Dos series superpuestas obligan a restar de cabeza.
 */
export function CheckinChart({ data }: { data: CheckinPointRow[] }) {
  const hasData = data.some((d) => d.participants > 0);

  if (!hasData) {
    return <ChartEmpty message="Sin partidos con convocados en este período." />;
  }

  const rows = data.map((d) => ({
    day: d.day,
    checkins: d.checkins,
    no_show: Math.max(0, d.participants - d.checkins),
  }));

  return (
    <div className="h-72 rounded-lg border border-neutral-outline-variant bg-surface-container p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <Bar dataKey="checkins" stackId="ck" fill={CHART_COLORS.brandPrimary} />
          <Bar
            dataKey="no_show"
            stackId="ck"
            fill={CHART_COLORS.outlineVariant}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
