"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "", label: "Overview", permission: "EVENT_VIEW" },
  { href: "/builder", label: "Page", permission: "EVENT_PAGE_EDIT" },
  { href: "/registrations", label: "Registrations", permission: "REGISTRATIONS_VIEW" },
  { href: "/teams", label: "Teams", permission: "TEAM_VIEW" },
  { href: "/attendance", label: "Attendance", permission: "ATTENDANCE_VIEW" },
  { href: "/scanner", label: "Scanner", permission: "ATTENDANCE_SCAN" },
  { href: "/certificates", label: "Certificates", permission: "CERTIFICATE_ISSUE" },
  { href: "/announcements", label: "Announcements", permission: "ANNOUNCEMENT_SEND" },
  { href: "/access", label: "Access", permission: "DELEGATE" },
  { href: "/settings", label: "Settings", permission: "EVENT_MANAGE_SETTINGS" },
];

export function EventAdminNav({ eventId, permissions }: { eventId: string; permissions: string[] }) {
  const pathname = usePathname();
  const base = `/admin/events/${eventId}`;
  const visible = tabs.filter((tab) => permissions.includes(tab.permission));
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
