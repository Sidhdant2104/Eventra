import { Skeleton } from "@/components/ui";

export default function StudentLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-16 w-2/3" />
      <Skeleton className="h-72 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
