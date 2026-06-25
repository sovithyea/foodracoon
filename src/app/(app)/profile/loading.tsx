import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto h-full max-w-lg overflow-y-auto px-6 py-10 pb-20 md:pb-10">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-3 h-20 rounded-xl" />
      <div className="mt-8 space-y-2">
        <Skeleton className="h-3 w-24" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
