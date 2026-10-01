import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Renglones de la planilla de disputas: dos equipos por partido. */
export default function DisputesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <div className="flex flex-col">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 border-b border-chalk-line py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
