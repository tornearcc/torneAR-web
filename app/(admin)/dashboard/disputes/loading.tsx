import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function DisputesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
