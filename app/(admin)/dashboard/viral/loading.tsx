import { PageHeaderSkeleton, Skeleton, StatBoardSkeleton } from "@/components/ui/Skeleton";

export default function ViralLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <StatBoardSkeleton count={3} />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
