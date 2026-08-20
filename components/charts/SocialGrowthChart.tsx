"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, formatDay } from "./chart-theme";
import { ChartTooltip } from "./ChartTooltip";
import { ChartEmpty } from "./ChartEmpty";
import type { SocialMetricPoint } from "@/lib/social-data";

/**
 * Evolución de seguidores de una cuenta social.
 *
 * Una sola serie (`followers`) y no varias, aunque la RPC devuelva más
 * métricas: seguidores, reach y views viven en órdenes de magnitud tan
 * distintos entre sí que compartir eje los aplasta a todos contra el cero, y
 * son la única métrica presente en las tres plataformas por igual — el resto
 * varía según cuál API la exponga.
 *
 * `connectNulls` no se pasa (default `false`): Recharts corta la línea en
 * cada `null` en vez de interpolar entre el último y el próximo dato real.
 * Es deliberado — un hueco de carga no es una progresión lineal de
 * seguidores, y dibujarla como tal sería mostrar un dato inventado.
 */
export function SocialGrowthChart({ data }: { data: SocialMetricPoint[] }) {
  const hasData = data.some((d) => d.followers !== null);

  if (!hasData) {
    return (
      <ChartEmpty message="Todavía no hay ningún snapshot cargado en este período." />
    );
  }

  return (
    <div className="h-72 rounded-lg border border-neutral-outline-variant bg-surface-container p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="social-followers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.brandPrimary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.brandPrimary} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis dataKey="day" tickFormatter={formatDay} {...AXIS_PROPS} />
          <YAxis
            allowDecimals={false}
            width={48}
            domain={["auto", "auto"]}
            {...AXIS_PROPS}
          />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.outline, strokeDasharray: "3 3" }}
            content={
              <ChartTooltip
                labelFormatter={(value) => formatDay(String(value))}
                nameFormatter={() => "Seguidores"}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="followers"
            stroke={CHART_COLORS.brandPrimary}
            strokeWidth={2}
            fill="url(#social-followers)"
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
