import { Skeleton } from "@/components/ui";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-px sm:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
