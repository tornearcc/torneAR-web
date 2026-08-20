"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useQueryNavigation } from "@/hooks/useQueryNavigation";
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, formatDay } from "./chart-theme";
import { ChartTooltip } from "./ChartTooltip";
import { ChartEmpty } from "./ChartEmpty";

export interface LogsByLevelRow {
  day: string;
  info_count: number;
  warn_count: number;
  error_count: number;
}

const LEVEL_NAME: Record<string, string> = {
  info_count: "Info",
  warn_count: "Warn",
  error_count: "Error",
};

/**
 * Serie diaria de logs por nivel.
 *
 * Con `enableDayFilter`, un click en una barra acota el explorador de abajo a
 * ese día (`?range=custom&from=X&to=X`). Es el gesto que convierte al gráfico
 * en el punto de entrada de una investigación: se ve el pico de errores del
 * martes y se pasa a leerlos, en vez de tener que traducir el pico a fechas a
 * mano en el filtro. Click de nuevo sobre el mismo día vuelve al rango previo.
 */
export function LogsChart({
  data,
  enableDayFilter = false,
  selectedDay = null,
}: {
  data: LogsByLevelRow[];
  enableDayFilter?: boolean;
  /** Día actualmente aislado, para resaltarlo y permitir deseleccionarlo. */
  selectedDay?: string | null;
}) {
  const { setParams } = useQueryNavigation();

  const hasLogs = data.some((d) => d.info_count + d.warn_count + d.error_count > 0);

  if (!hasLogs) {
    return <ChartEmpty message="Sin logs en este período." />;
  }

  function handleDayClick(day: string | undefined) {
    if (!enableDayFilter || !day) return;

    if (day === selectedDay) {
      // Deseleccionar: se vuelve al preset por defecto en vez de dejar un
      // `range=custom` de un solo día que el usuario ya no quiere.
      setParams({ range: null, from: null, to: null });
      return;
    }

    setParams({ range: "custom", from: day, to: day });
  }

  return (
    <div className="h-72 rounded-lg border border-neutral-outline-variant bg-surface-container p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          onClick={(state: { activeLabel?: string | number }) =>
            handleDayClick(state?.activeLabel ? String(state.activeLabel) : undefined)
          }
          style={enableDayFilter ? { cursor: "pointer" } : undefined}
        >
          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis dataKey="day" tickFormatter={formatDay} {...AXIS_PROPS} />
          <YAxis allowDecimals={false} width={32} {...AXIS_PROPS} />
          <Tooltip
            cursor={{ fill: CHART_COLORS.surfaceHigh, fillOpacity: 0.45 }}
            content={
              <ChartTooltip
                labelFormatter={(value) => formatDay(String(value))}
                nameFormatter={(name) => LEVEL_NAME[name] ?? name}
              />
            }
          />
          <Legend
            formatter={(value) => LEVEL_NAME[value] ?? value}
            wrapperStyle={{ fontSize: 12, color: CHART_COLORS.onSurfaceVariant }}
          />

          {/*
            Las Cell existen sólo para atenuar los días no seleccionados. Sin
            eso, tras filtrar por un día el gráfico se ve igual que antes y no
            hay señal de qué está aislado.
          */}
          <Bar dataKey="info_count" stackId="logs" fill={CHART_COLORS.info}>
            {data.map((entry) => (
              <Cell key={entry.day} fillOpacity={dimmed(entry.day, selectedDay)} />
            ))}
          </Bar>
          <Bar dataKey="warn_count" stackId="logs" fill={CHART_COLORS.warn}>
            {data.map((entry) => (
              <Cell key={entry.day} fillOpacity={dimmed(entry.day, selectedDay)} />
            ))}
          </Bar>
          <Bar dataKey="error_count" stackId="logs" fill={CHART_COLORS.error}>
            {data.map((entry) => (
              <Cell key={entry.day} fillOpacity={dimmed(entry.day, selectedDay)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function dimmed(day: string, selectedDay: string | null): number {
  if (!selectedDay) return 1;
  return day === selectedDay ? 1 : 0.25;
}
