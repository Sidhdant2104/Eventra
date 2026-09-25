import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false, href = "/" }: { className?: string; light?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-baseline gap-2", className)} aria-label="NMIET One">
      <span className={cn("text-[11px] font-semibold tracking-[0.22em]", light ? "text-white/70" : "text-muted")}>NMIET</span>
      <span className={cn("text-[15px] font-semibold tracking-[-0.04em]", light ? "text-white" : "text-ink")}>
        <span className="mr-1 inline-block h-[0.72em] w-[3px] translate-y-[1px] bg-accent align-[-1px]" />
        ONE
      </span>
    </Link>
  );
}
