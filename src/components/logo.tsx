import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false, href = "/", admin = false }: { className?: string; light?: boolean; href?: string; admin?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-baseline gap-2", className)} aria-label={admin ? "Eventra Admin" : "Eventra"}>
      <span className={cn("text-[15px] font-semibold tracking-[-0.04em]", light ? "text-white" : "text-ink")}>
        <span className="mr-1.5 inline-block h-[0.72em] w-[3px] translate-y-[1px] bg-accent align-[-1px]" />
        Eventra
      </span>
      {admin ? <span className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", light ? "text-white/70" : "text-muted")}>Admin</span> : null}
    </Link>
  );
}
