import {
  ChartSkeleton,
  PageHeaderSkeleton,
  Skeleton,
  StatCardsSkeleton,
} from "@/components/ui/Skeleton";

export default function GrowthLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} className="sm:grid-cols-2 xl:grid-cols-4" />

      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-36" />
        {/* h-72: mismo alto que el contenedor de GrowthChart, así el layout
            no salta cuando llega el dato. */}
        <ChartSkeleton className="h-72" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-full max-w-3xl" />
        <Skeleton className="h-48 rounded-lg" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-3xl" />
        <ChartSkeleton className="h-48" />
      </div>
    </div>
  );
}
