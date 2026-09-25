import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { ButtonLink } from "@/components/ui";
import { prisma } from "@/lib/db";
import { yearLabel } from "@/lib/format";
import { requireUser } from "@/lib/permissions";
import { isProfileComplete } from "@/lib/utils";

export default async function SoloRegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const event = await prisma.event.findUnique({ where: { slug }, include: { fields: { orderBy: { position: "asc" } }, club: true } });
  if (!event || event.status !== "PUBLISHED") notFound();
  if (event.registrationMode === "TEAM") redirect(`/events/${slug}/team/new`);
  const existing = await prisma.registrationParticipant.findFirst({
    where: { userId: user.id, eventId: event.id, registration: { status: { not: "CANCELLED" } } },
  });
  if (existing) redirect(`/registrations/${existing.id}`);
  if (!isProfileComplete(user)) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Almost there</p>
        <h1 className="mt-3 font-display text-5xl">Complete your profile first</h1>
        <p className="mt-4 text-[15px] leading-7 text-secondary">Registration uses the profile you save once. Name, department, year, and roll number are not asked again.</p>
        <ButtonLink className="mt-8" href="/profile?complete=1">Go to profile</ButtonLink>
      </main>
    );
  }
  const year = yearLabel(user.profile?.year);
  return (
    <main id="content" className="mx-auto max-w-xl px-4 py-12">
      <Link href={`/events/${slug}`} className="text-sm text-muted">Back to {event.name}</Link>
      <p className="mt-8 text-[11px] uppercase tracking-[0.18em] text-muted">{event.club.name}</p>
      <h1 className="mt-3 font-display text-5xl sm:text-6xl">Register for {event.name}</h1>
      <p className="mt-4 text-[15px] text-secondary">You are registering as</p>
      <div className="mt-4 border-y border-line py-5">
        <p className="text-2xl font-medium tracking-[-0.03em]">{user.name}</p>
        <p className="mt-1 text-secondary">{user.profile?.department} · {year}{user.profile?.division ? ` · Division ${user.profile.division}` : ""}</p>
        <p className="mt-1 text-sm text-muted">{user.email} · {user.profile?.rollNumber}</p>
      </div>
      <div className="mt-8">
        <RegisterForm slug={slug} mode="SOLO" fields={event.fields} />
      </div>
    </main>
  );
}
