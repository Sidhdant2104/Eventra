"use client";

import { Award, Bell, Building2, CalendarDays, Compass, GraduationCap, LayoutDashboard, ScrollText, Shield, Ticket, Users } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const studentLinks = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
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
  workspace,
}: {
  children: React.ReactNode;
  name?: string | null;
  image?: string | null;
  unread: number;
  workspace?: boolean;
}) {
  const pathname = usePathname();
  const links = name ? studentLinks : [{ href: "/explore", label: "Explore", icon: Compass }];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Logo href={name ? "/home" : "/"} />
          <nav className="hidden items-center gap-7 md:flex" aria-label="Student">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
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
                <details className="relative">
                  <summary aria-label="Account" className="grid h-9 w-9 cursor-pointer list-none place-items-center overflow-hidden bg-ink text-[12px] font-medium text-white [&::-webkit-details-marker]:hidden">
                    {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1)}
                  </summary>
                  <div className="absolute right-0 z-40 mt-2 w-56 border border-line bg-white p-1.5 shadow-sm">
                    <p className="truncate px-3 py-2 text-sm font-medium">{name}</p>
                    <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-surface">Profile</Link>
                    {workspace ? <Link href="/admin" className="block px-3 py-2 text-sm font-medium hover:bg-surface">Open Eventra Admin</Link> : null}
                    <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="block w-full px-3 py-2 text-left text-sm text-muted hover:bg-surface hover:text-ink">Log out</button>
                  </div>
                </details>
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
          <ul className="grid grid-cols-5">
            {studentLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;
              const short = link.label === "My Events" ? "Events" : link.label === "Certificates" ? "Awards" : link.label;
              return (
                <li key={link.href}>
                  <Link href={link.href} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium", active ? "text-ink" : "text-muted")}>
                    <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
                    {short}
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

type AdminLink = { href: string; label: string; exact?: boolean };
type AdminGroup = { label: string; links: AdminLink[] };

export function AdminShell({
  children,
  name,
  context,
  groups,
}: {
  children: React.ReactNode;
  name: string;
  context: string;
  groups: AdminGroup[];
}) {
  const pathname = usePathname();
  const links = groups.flatMap((group) => group.links);
  const activeHref = links
    .filter((link) => (link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <div className="min-h-screen bg-[#f6f6f4] md:grid md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="px-5 py-5">
          <Logo href="/admin" admin />
          <p className="mt-3 text-sm font-medium">{context}</p>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-3 pb-3 md:block md:flex-1 md:space-y-6 md:overflow-visible md:px-3" aria-label="Admin">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="hidden px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted md:block">{group.label}</p>
              <div className="flex gap-1 md:block md:space-y-0.5">
                {group.links.map((link) => {
                  const Icon = adminIcon(link.href);
                  return (
                    <Link key={link.href} href={link.href} className={cn("flex items-center gap-2 whitespace-nowrap px-3 py-2 text-[13px]", link.href === activeHref ? "bg-ink text-white" : "text-secondary hover:bg-ink/5")}>
                      <Icon size={15} strokeWidth={1.75} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="hidden border-t border-line px-5 py-4 md:block">
          <p className="truncate text-sm font-medium">{name}</p>
          <Link href="/home" className="mt-3 inline-block text-[13px] text-secondary hover:text-ink">← Back to Eventra</Link>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 md:px-8">
          <div className="min-w-0">
            <Link href="/home" className="text-[13px] text-secondary hover:text-ink md:hidden">← Back to Eventra</Link>
            <p className="truncate text-sm font-medium">Eventra Admin / {context}</p>
          </div>
          <form action="/admin/events" className="hidden min-w-0 flex-1 md:block">
            <label className="sr-only" htmlFor="admin-search">Search events</label>
            <input id="admin-search" name="q" placeholder="Search events" className="h-9 w-full max-w-sm border border-line bg-[#f6f6f4] px-3 text-sm outline-none focus:border-ink" />
          </form>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/notifications" className="text-ink" aria-label="Notifications"><Bell size={16} /></Link>
            <details className="relative">
              <summary aria-label="Account" className="grid h-8 w-8 cursor-pointer list-none place-items-center bg-ink text-[12px] text-white [&::-webkit-details-marker]:hidden">{name.slice(0, 1)}</summary>
              <div className="absolute right-0 z-40 mt-2 w-52 border border-line bg-white p-1.5 shadow-sm">
                <p className="truncate px-3 py-2 text-sm font-medium">{name}</p>
                <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-[#f6f6f4]">Profile</Link>
                <Link href="/home" className="block px-3 py-2 text-sm hover:bg-[#f6f6f4]">Back to Eventra</Link>
                <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="block w-full px-3 py-2 text-left text-sm text-muted hover:bg-[#f6f6f4] hover:text-ink">Log out</button>
              </div>
            </details>
          </div>
        </div>
        <main id="content" className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function adminIcon(href: string) {
  if (href === "/admin") return LayoutDashboard;
  if (href.includes("/builder")) return Compass;
  if (href.includes("/registrations")) return Ticket;
  if (href.includes("/scanner")) return Ticket;
  if (href.includes("/attendance")) return CalendarDays;
  if (href.includes("/certificates")) return Award;
  if (href.includes("/announcements")) return Bell;
  if (href.includes("/access")) return Shield;
  if (href.startsWith("/admin/events")) return CalendarDays;
  if (href.startsWith("/admin/users")) return Users;
  if (href.startsWith("/admin/academics")) return GraduationCap;
  if (href.startsWith("/admin/audit")) return ScrollText;
  if (href.startsWith("/admin/clubs")) return Building2;
  return Shield;
}
