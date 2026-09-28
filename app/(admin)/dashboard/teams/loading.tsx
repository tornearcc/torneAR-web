import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function TeamsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-9 w-72 max-w-full rounded-md" />
      <Skeleton className="h-[560px] rounded-lg" />
    </div>
  );
}
