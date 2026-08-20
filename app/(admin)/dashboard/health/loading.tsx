import {
  ChartSkeleton,
  PageHeaderSkeleton,
  Skeleton,
  StatCardsSkeleton,
} from "@/components/ui/Skeleton";

export default function HealthLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} className="sm:grid-cols-2 xl:grid-cols-4" />

      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-72" />
        <ChartSkeleton className="h-72" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-6 w-52" />
          {/* Toolbar: búsqueda + nivel + filas por página. */}
          <Skeleton className="h-9 w-[420px] max-w-full rounded-md" />
        </div>
        <Skeleton className="h-[520px] rounded-lg" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
