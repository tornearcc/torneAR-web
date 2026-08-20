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

export interface MarketPointRow {
  day: string;
  player_posts: number;
  team_posts: number;
  applications: number;
}

const SERIES_NAME: Record<string, string> = {
  player_posts: "Avisos de jugador",
  team_posts: "Avisos de equipo",
  applications: "Postulaciones",
};

export function MarketChart({ data }: { data: MarketPointRow[] }) {
  const hasData = data.some(
    (d) => d.player_posts > 0 || d.team_posts > 0 || d.applications > 0,
  );

  if (!hasData) {
    return <ChartEmpty message="Sin movimiento en el mercado de pases en este período." />;
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
          {/* Los avisos se apilan entre sí (son el mismo acto: publicar) y las
              postulaciones van en su propia barra: comparar oferta contra
              respuesta es justamente lo que dice si el mercado funciona. */}
          <Bar dataKey="player_posts" stackId="posts" fill={CHART_COLORS.info} />
          <Bar
            dataKey="team_posts"
            stackId="posts"
            fill={CHART_COLORS.alertOrange}
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="applications"
            fill={CHART_COLORS.brandPrimary}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
