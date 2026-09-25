"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "", label: "Overview", scan: true },
  { href: "/builder", label: "Page", scan: false },
  { href: "/registrations", label: "Registrations", scan: false },
  { href: "/teams", label: "Teams", scan: false },
  { href: "/attendance", label: "Attendance", scan: true },
  { href: "/scanner", label: "Scanner", scan: true },
  { href: "/certificates", label: "Certificates", scan: false },
  { href: "/announcements", label: "Announcements", scan: false },
  { href: "/settings", label: "Settings", scan: false },
];

export function EventAdminNav({ eventId, level }: { eventId: string; level: "full" | "manage" | "scan" }) {
  const pathname = usePathname();
  const base = `/admin/events/${eventId}`;
  const visible = tabs.filter((tab) => level !== "scan" || tab.scan);
  return (
    <nav className="flex gap-1 overflow-x-auto pb-4" aria-label="Event sections">
      {visible.map((tab) => {
        const href = `${base}${tab.href}`;
        const active = tab.href === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link key={tab.href} href={href} className={cn("whitespace-nowrap border-b-2 px-3 py-2 text-[13px]", active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink")}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
