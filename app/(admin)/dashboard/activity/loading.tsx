import {
  ChartSkeleton,
  PageHeaderSkeleton,
  Skeleton,
  StatCardsSkeleton,
} from "@/components/ui/Skeleton";

export default function ActivityLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} className="sm:grid-cols-2 xl:grid-cols-4" />

      <div className="flex flex-col gap-4">
        {/* Fila de tabs (Partidos / Check-ins / Mercado). */}
        <Skeleton className="h-9 w-72 rounded-lg" />
        <Skeleton className="h-6 w-48" />
        <ChartSkeleton className="h-72" />
      </div>
    </div>
  );
}
