"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { AXIS_PROPS, CHART_COLORS, formatDay } from "./chart-theme";
import { ChartTooltip } from "./ChartTooltip";

/**
 * Barras diarias chicas, de una sola serie, para acompañar un número del
 * tanteador. Sin eje Y ni grilla: el detalle exacto está en el tooltip y el
 * número grande de arriba ya dice cuánto. Una sola serie, así que no lleva
 * leyenda; la nombra el título de la sección.
 */
export function DailyBars({
  data,
  seriesName,
  height = 96,
}: {
  data: { day: string; value: number }[];
  /** Cómo se llama la serie en el tooltip («Altas»). */
  seriesName: string;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap={2}>
          <XAxis
            dataKey="day"
            tickFormatter={formatDay}
            interval="preserveStartEnd"
            minTickGap={48}
            axisLine={{ stroke: CHART_COLORS.outlineVariant }}
            {...AXIS_PROPS}
            stroke={CHART_COLORS.outline}
          />
          <Tooltip
            cursor={{ fill: CHART_COLORS.surfaceHigh }}
            content={
              <ChartTooltip
                labelFormatter={(value) => formatDay(String(value))}
                nameFormatter={() => seriesName}
              />
            }
          />
          <Bar
            dataKey="value"
            name={seriesName}
            fill={CHART_COLORS.onSurfaceVariant}
            radius={[3, 3, 0, 0]}
            minPointSize={1}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
