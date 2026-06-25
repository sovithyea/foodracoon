import { Skeleton } from "@/components/ui/skeleton";

export default function ListsLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F5F0E8]">
      <div className="flex items-center justify-between border-b border-[#D4C8B4] px-4 py-3.5">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24 md:pb-4">
        <div className="grid grid-cols-3 gap-2.5">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-3 w-16" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
