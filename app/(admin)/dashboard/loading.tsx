import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

/**
 * Boundary de carga por defecto de todos los paneles.
 *
 * Su razón de ser es tanto lo que muestra como lo que NO reemplaza: sin este
 * archivo, la navegación entre pestañas caía en `(admin)/loading.tsx`, que es
 * un spinner a pantalla completa y por lo tanto arrancaba el sidebar de la
 * pantalla en cada click. Al vivir dentro de `dashboard/`, este skeleton se
 * renderiza dentro del <main> y el shell queda quieto.
 *
 * La forma copia el tanteador del Resumen (tres colas, una fila de números y
 * el bloque de crecimiento) para que la página no salte al llegar el dato.
 * Los segmentos con layout propio tienen su propio loading.tsx y ganan sobre
 * éste.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeaderSkeleton />

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-5">
            <Skeleton className="h-[76px] w-[56px] rounded-[5px]" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-full" />
        <div className="grid grid-cols-3 gap-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
