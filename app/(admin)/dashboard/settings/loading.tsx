import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
