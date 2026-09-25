"use client";

import { Bell, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const studentLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/registrations", label: "My Events" },
  { href: "/teams", label: "Teams" },
  { href: "/certificates", label: "Certificates" },
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
      <header className="sticky top-0 z-30 border-b border-line/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Logo href={name ? "/home" : "/"} />
          <nav className="hidden items-center gap-7 md:flex" aria-label="Student">
            {(name ? studentLinks : [{ href: "/explore", label: "Explore" }]).map((link) => {
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
      <main id="content" className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 md:pb-16">{children}</main>
      {name ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background/95 backdrop-blur md:hidden" aria-label="Mobile">
          <ul className="grid grid-cols-4">
            {studentLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link href={link.href} className={cn("flex h-14 items-center justify-center text-[12px] font-medium", active ? "text-ink" : "text-muted")}>
                    {link.label === "My Events" ? "Events" : link.label}
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

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/clubs", label: "Clubs" },
  { href: "/admin/users", label: "People" },
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
  const links = adminLinks.filter((link) => showUsers || link.href !== "/admin/users");
  return (
    <div className="min-h-screen bg-[#f7f7f5] md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-line bg-surface md:min-h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-5">
          <Logo href="/admin" />
        </div>
        <p className="hidden px-5 pb-4 text-[12px] leading-5 text-muted md:block">
          <span className="block text-ink">{name}</span>
          {role.replaceAll("_", " ").toLowerCase()}
        </p>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-0.5 md:px-3" aria-label="Admin">
          {links.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={cn("block whitespace-nowrap px-3 py-2 text-[13px]", active ? "bg-ink text-white" : "text-secondary hover:bg-ink/5")}>
                {link.label}
              </Link>
            );
          })}
          <Link href="/home" className="block whitespace-nowrap px-3 py-2 text-[13px] text-muted hover:bg-ink/5">Student view</Link>
        </nav>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3 md:px-8">
          <p className="text-[12px] uppercase tracking-[0.16em] text-muted">Organizer</p>
          <button type="button" className="text-[13px] font-medium" onClick={() => signOut({ callbackUrl: "/" })}>Log out</button>
        </div>
        <main id="content" className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
