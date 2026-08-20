import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function SeasonsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <Skeleton className="h-36 rounded-lg" />
      <Skeleton className="h-72 rounded-lg" />
    </div>
  );
}
