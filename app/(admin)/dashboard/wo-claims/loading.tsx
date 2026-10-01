import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Renglones de reclamos: evidencia a la izquierda y datos a la derecha. */
export default function WoClaimsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <div className="flex flex-col">
        {Array.from({ length: 2 }, (_, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-6 border-b border-chalk-line py-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10"
          >
            <Skeleton className="h-72" />
            <Skeleton className="h-56" />
          </div>
        ))}
      </div>
    </div>
  );
}
