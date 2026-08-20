"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_PROPS, CHART_COLORS, GRID_PROPS } from "./chart-theme";
import { ChartTooltip } from "./ChartTooltip";
import { ChartEmpty } from "./ChartEmpty";
import type { AttributionRow } from "@/lib/analytics-data";

/** Etiquetas legibles para los canales que de verdad usa la épica de Marketing & Growth. */
const SOURCE_LABELS: Record<string, string> = {
  organico: "Orgánico",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  whatsapp: "WhatsApp",
};

function labelFor(source: string): string {
  return SOURCE_LABELS[source] ?? source.charAt(0).toUpperCase() + source.slice(1);
}

interface SourceTotal {
  source: string;
  label: string;
  signups: number;
}

/**
 * Agrega las filas (source, campaign, signups) de `dashboard_attribution_stats`
 * a un total por canal — la granularidad de campaña sirve para un desglose
 * futuro, pero "de dónde vienen los usuarios" es una pregunta por canal.
 */
function aggregateBySource(rows: AttributionRow[]): SourceTotal[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.utm_source, (totals.get(row.utm_source) ?? 0) + row.signups);
  }
  return Array.from(totals.entries())
    .map(([source, signups]) => ({ source, label: labelFor(source), signups }))
    .sort((a, b) => b.signups - a.signups);
}

/**
 * Barras horizontales y no torta: con "orgánico" casi siempre dominando el
 * total en una app en crecimiento temprano, una torta aplasta el resto de
 * los canales contra una porción invisible. Una barra permite comparar
 * magnitudes reales entre canales chicos sin que el más grande se coma la
 * lectura de los demás.
 */
export function AttributionChart({ rows }: { rows: AttributionRow[] }) {
  const data = aggregateBySource(rows);
  const hasData = data.some((d) => d.signups > 0);

  if (!hasData) {
    return <ChartEmpty message="Sin altas en este período." />;
  }

  // Alto proporcional a la cantidad de canales: con 2-3 barras un alto fijo
  // de gráfico de líneas se ve vacío arriba; con muchos canales, muy apretado.
  const height = Math.max(180, data.length * 56);

  return (
    <div
      className="rounded-lg border border-neutral-outline-variant bg-surface-container p-4"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
        >
          <CartesianGrid {...GRID_PROPS} horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
          <YAxis
            type="category"
            dataKey="label"
            width={100}
            {...AXIS_PROPS}
          />
          <Tooltip
            cursor={{ fill: CHART_COLORS.surfaceHigh }}
            content={<ChartTooltip nameFormatter={() => "Altas"} />}
          />
          <Bar
            dataKey="signups"
            name="Altas"
            fill={CHART_COLORS.brandPrimary}
            radius={[0, 4, 4, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
