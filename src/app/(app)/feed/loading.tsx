import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="mx-auto h-full max-w-lg overflow-y-auto px-4 py-6 pb-20 md:pb-6">
      <Skeleton className="mb-4 h-7 w-12" />
      <div className="flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
