import { Download } from "lucide-react";

import { formatRangeLabel, resolveDateRange } from "@/lib/date-range";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { SegmentedFilter } from "@/components/ui/SegmentedFilter";
import { Button } from "@/components/ui/button";

/**
 * `value` es el segmento de `/api/og/[template]`, así que renombrar uno
 * rompe los links ya compartidos de la preview — y tiene que seguir
 * coincidiendo con el `TEMPLATES` de ese route handler, que es quien decide
 * si el segmento existe.
 */
const TEMPLATE_OPTIONS = [
  { value: "mvp", label: "MVP" },
  { value: "scorer", label: "Goleador" },
  { value: "elo", label: "Salto de ELO" },
  { value: "epic", label: "El Partidazo" },
  { value: "zone", label: "Líderes de zona" },
] as const;

type TemplateId = (typeof TEMPLATE_OPTIONS)[number]["value"];

function isTemplateId(value: string | undefined): value is TemplateId {
  return TEMPLATE_OPTIONS.some((option) => option.value === value);
}

/**
 * UI del Content Factory: elegir plantilla + rango, mirar la vista previa,
 * descargar. Sin estado de cliente propio — plantilla y rango viven en la
 * URL (mismo patrón que el resto del dashboard), así que la imagen de
 * preview es un `<img src>` server-rendered de punta a punta: cambiar
 * cualquiera de los dos filtros navega, este Server Component vuelve a
 * correr, y el `src` que arma sale distinto sin una línea de JS de cliente.
 */
export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const range = resolveDateRange(params);

  const rawTemplate = Array.isArray(params.template) ? params.template[0] : params.template;
  const template: TemplateId = isTemplateId(rawTemplate) ? rawTemplate : "mvp";
  const templateLabel = TEMPLATE_OPTIONS.find((option) => option.value === template)?.label ?? template;

  const imageUrl = `/api/og/${template}?from=${range.from}&to=${range.to}`;
  const filename = `tornear-${template}-${range.from}_a_${range.to}.png`;

  return (
    <PageTransition>
      <PageHeader
        title="Contenido"
        description={`Tarjetas exportables para redes · ${formatRangeLabel(range)}`}
        actions={
          // `flex-wrap` propio: el slot `actions` de `PageHeader` no envuelve,
          // y con cinco plantillas más el filtro de fechas la fila se pasa del
          // ancho en pantallas de laptop.
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SegmentedFilter
              param="template"
              options={TEMPLATE_OPTIONS}
              active={template}
              defaultValue="mvp"
            />
            <DateRangeFilter range={range} />
          </div>
        }
      />

      <section className="flex flex-col items-center gap-4">
        <div className="overflow-hidden rounded-lg border border-neutral-outline-variant bg-surface-container">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen generada server-side por /api/og; no hay beneficio de next/image sobre un endpoint dinámico que ya sirve el tamaño final */}
          <img
            key={imageUrl}
            src={imageUrl}
            alt={`Vista previa: ${templateLabel}`}
            width={1080}
            height={1350}
            className="block h-auto w-full max-w-md"
          />
        </div>

        <Button asChild>
          <a href={imageUrl} download={filename}>
            <Download className="size-4" aria-hidden="true" />
            Descargar PNG
          </a>
        </Button>

        <p className="max-w-md text-center text-xs text-neutral-on-surface-variant">
          Si el período elegido no tiene un destacado que supere el umbral mínimo, la
          tarjeta lo dice en vez de mostrar datos inventados.
        </p>
      </section>
    </PageTransition>
  );
}
