import { PageHeaderSkeleton, Skeleton, StatCardsSkeleton } from "@/components/ui/Skeleton";

export default function ViralLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} className="sm:grid-cols-2 xl:grid-cols-4" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
