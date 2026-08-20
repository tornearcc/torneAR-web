import { PageHeaderSkeleton, Skeleton, StatCardsSkeleton } from "@/components/ui/Skeleton";

/**
 * Boundary de carga por defecto de todos los paneles.
 *
 * Su razón de ser es tanto lo que muestra como lo que NO reemplaza: sin este
 * archivo, la navegación entre pestañas caía en `(admin)/loading.tsx`, que es
 * un spinner a pantalla completa y por lo tanto arrancaba el sidebar de la
 * pantalla en cada click. Al vivir dentro de `dashboard/`, este skeleton se
 * renderiza dentro del <main> y el shell queda quieto.
 *
 * Los segmentos con layout propio tienen su propio loading.tsx y ganan sobre
 * éste.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />

      {/* Ahora mismo */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <StatCardsSkeleton count={4} className="sm:grid-cols-2 xl:grid-cols-4" />
      </div>

      {/* Requiere atención */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-lg" />
          ))}
        </div>
      </div>

      {/* Tendencia */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-44" />
        <StatCardsSkeleton count={4} className="sm:grid-cols-2 xl:grid-cols-4" />
      </div>
    </div>
  );
}
