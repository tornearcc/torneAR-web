"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, formatDay } from "./chart-theme";
import { ChartTooltip } from "./ChartTooltip";
import { ChartEmpty } from "./ChartEmpty";
import type { InstagramDay } from "@/lib/instagram-insights-data";

const SERIES_NAME: Record<string, string> = {
  views: "Vistas",
  reach: "Cuentas alcanzadas",
  profile_views: "Visitas al perfil",
  website_clicks: "Toques en el link",
};

const formatCount = (value: number) => value.toLocaleString("es-AR");

const EMPTY_MESSAGE = "Sin estadísticas en este período: se cargan desde que se conectó la cuenta (y 30 días hacia atrás).";

/**
 * Vistas y cuentas alcanzadas por día. Mismo eje porque son la misma unidad
 * (cuentas o reproducciones) y del mismo orden; la distancia entre las dos
 * líneas es cuántas veces vuelve a ver lo mismo cada cuenta.
 *
 * `connectNulls` en false: un día sin dato es un hueco, no una interpolación.
 */
export function InstagramReachChart({ data }: { data: InstagramDay[] }) {
  if (!data.some((d) => d.views !== null || d.reach !== null)) {
    return <ChartEmpty message={EMPTY_MESSAGE} />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis dataKey="day" tickFormatter={formatDay} {...AXIS_PROPS} />
          <YAxis allowDecimals={false} width={48} tickFormatter={formatCount} {...AXIS_PROPS} />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.outline, strokeDasharray: "3 3" }}
            content={
              <ChartTooltip
                labelFormatter={(value) => formatDay(String(value))}
                nameFormatter={(name) => SERIES_NAME[name] ?? name}
                valueFormatter={formatCount}
              />
            }
          />
          <Legend
            formatter={(value) => SERIES_NAME[value] ?? value}
            wrapperStyle={{ fontSize: 12, color: CHART_COLORS.onSurfaceVariant }}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke={CHART_COLORS.series1}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="reach"
            stroke={CHART_COLORS.series2}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Visitas al perfil (barras) y toques en el link de la bio (línea) por día.
 * Separado del gráfico de vistas: comparten unidad pero van en cientos
 * contra miles, y en el mismo eje quedarían aplastadas contra el cero.
 */
export function InstagramProfileChart({ data }: { data: InstagramDay[] }) {
  if (!data.some((d) => d.profile_views !== null || d.website_clicks !== null)) {
    return <ChartEmpty message={EMPTY_MESSAGE} />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis dataKey="day" tickFormatter={formatDay} {...AXIS_PROPS} />
          <YAxis allowDecimals={false} width={40} tickFormatter={formatCount} {...AXIS_PROPS} />
          <Tooltip
            cursor={{ fill: CHART_COLORS.surfaceHigh, fillOpacity: 0.45 }}
            content={
              <ChartTooltip
                labelFormatter={(value) => formatDay(String(value))}
                nameFormatter={(name) => SERIES_NAME[name] ?? name}
                valueFormatter={formatCount}
              />
            }
          />
          <Legend
            formatter={(value) => SERIES_NAME[value] ?? value}
            wrapperStyle={{ fontSize: 12, color: CHART_COLORS.onSurfaceVariant }}
          />
          <Bar dataKey="profile_views" fill={CHART_COLORS.series1} radius={[3, 3, 0, 0]} />
          <Line
            type="monotone"
            dataKey="website_clicks"
            stroke={CHART_COLORS.series2}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
