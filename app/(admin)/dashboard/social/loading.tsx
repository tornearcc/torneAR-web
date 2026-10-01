import {
  ChartSkeleton,
  PageHeaderSkeleton,
  Skeleton,
  StatBoardSkeleton,
} from "@/components/ui/Skeleton";

export default function SocialLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <StatBoardSkeleton count={2} />

      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <ChartSkeleton className="h-72" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-52 rounded-lg" />
      </div>
    </div>
  );
}
