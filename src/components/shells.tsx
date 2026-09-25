"use client";

import { Award, Bell, Building2, CalendarDays, Compass, LayoutDashboard, LogOut, Ticket, Users } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const studentLinks = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/registrations", label: "My Events", icon: Ticket },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/certificates", label: "Certificates", icon: Award },
];

export function StudentShell({
  children,
  name,
  image,
  unread,
}: {
  children: React.ReactNode;
  name?: string | null;
  image?: string | null;
  unread: number;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Logo href={name ? "/home" : "/"} />
          <nav className="hidden items-center gap-7 md:flex" aria-label="Student">
            {(name ? studentLinks : [{ href: "/explore", label: "Explore", icon: Compass }]).map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} className={cn("text-sm transition", active ? "text-ink" : "text-muted hover:text-ink")}>
                  <span className={cn("border-b pb-0.5", active ? "border-accent" : "border-transparent")}>{link.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1">
            {name ? (
              <>
                <Link href="/notifications" className="relative grid h-10 w-10 place-items-center text-ink" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
                  <Bell size={18} strokeWidth={1.75} />
                  {unread > 0 ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                </Link>
                <Link href="/profile" className="grid h-9 w-9 place-items-center overflow-hidden bg-ink text-[12px] font-medium text-white" aria-label="Profile">
                  {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1)}
                </Link>
                <button type="button" className="hidden h-10 w-10 place-items-center text-muted hover:text-ink md:grid" aria-label="Log out" onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut size={16} strokeWidth={1.75} />
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-ink px-4 py-2 text-sm font-medium text-white">Sign in</Link>
            )}
          </div>
        </div>
      </header>
      <main id="content" className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-16 md:pt-8">{children}</main>
      {name ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="Mobile">
          <ul className="grid grid-cols-4">
            {studentLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link href={link.href} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium", active ? "text-ink" : "text-muted")}>
                    <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
                    {link.label === "My Events" ? "Events" : link.label === "Certificates" ? "Awards" : link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

const adminGroups = [
  {
    label: "Operations",
    links: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/events", label: "Events", icon: CalendarDays, exact: false },
    ],
  },
  {
    label: "People",
    links: [{ href: "/admin/users", label: "People", icon: Users, exact: false, super: true }],
  },
  {
    label: "System",
    links: [{ href: "/admin/clubs", label: "Clubs", icon: Building2, exact: false }],
  },
];

export function AdminShell({
  children,
  name,
  role,
  showUsers,
}: {
  children: React.ReactNode;
  name: string;
  role: string;
  showUsers: boolean;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#f6f6f4] md:grid md:grid-cols-[232px_1fr]">
      <aside className="flex flex-col border-b border-line bg-surface md:min-h-screen md:border-b-0 md:border-r">
        <div className="px-5 py-5">
          <Logo href="/admin" />
        </div>
        <nav className="flex gap-4 overflow-x-auto px-3 pb-3 md:block md:flex-1 md:space-y-6 md:overflow-visible md:px-3" aria-label="Admin">
          {adminGroups.map((group) => {
            const links = group.links.filter((link) => showUsers || !("super" in link && link.super));
            if (links.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="hidden px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted md:block">{group.label}</p>
                <div className="flex gap-1 md:block md:space-y-0.5">
                  {links.map((link) => {
                    const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                    const Icon = link.icon;
                    return (
                      <Link key={link.href} href={link.href} className={cn("flex items-center gap-2 whitespace-nowrap px-3 py-2 text-[13px]", active ? "bg-ink text-white" : "text-secondary hover:bg-ink/5")}>
                        <Icon size={15} strokeWidth={1.75} />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="hidden border-t border-line px-5 py-4 md:block">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-[12px] capitalize text-muted">{role.replaceAll("_", " ").toLowerCase()}</p>
          <Link href="/home" className="mt-3 inline-block text-[13px] text-secondary hover:text-ink">Student view</Link>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 md:px-8">
          <form action="/admin/events" className="hidden min-w-0 flex-1 md:block">
            <label className="sr-only" htmlFor="admin-search">Search events</label>
            <input id="admin-search" name="q" placeholder="Search events" className="h-9 w-full max-w-sm border border-line bg-[#f6f6f4] px-3 text-sm outline-none focus:border-ink" />
          </form>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/notifications" className="text-ink" aria-label="Notifications"><Bell size={16} /></Link>
            <Link href="/profile" className="grid h-8 w-8 place-items-center bg-ink text-[12px] text-white" aria-label="Profile">{name.slice(0, 1)}</Link>
            <button type="button" className="text-[13px] font-medium" onClick={() => signOut({ callbackUrl: "/" })}>Log out</button>
          </div>
        </div>
        <main id="content" className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
