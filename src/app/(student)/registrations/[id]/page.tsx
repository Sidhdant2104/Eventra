import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PassCard } from "@/components/pass-card";
import { Button } from "@/components/ui";
import { cancelRegistration } from "@/lib/actions/registration";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "Event pass" };

export default async function PassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ready?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const participant = await prisma.registrationParticipant.findFirst({
    where: { id, userId: user.id },
    include: { pass: true, registration: { include: { event: { include: { club: true } }, team: true } }, user: true },
  });
  if (!participant?.pass) notFound();
  const canCancel = participant.registration.userId === user.id || participant.registration.team?.captainId === user.id;
  return (
    <div className="space-y-8">
      <Link href="/registrations" className="text-sm text-muted">My events</Link>
      {query.ready === "1" ? (
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-accent">You&apos;re registered</p>
          <h1 className="mt-2 font-display text-5xl">Your pass is ready.</h1>
        </div>
      ) : null}
      <PassCard
        token={participant.pass.token}
        eventName={participant.registration.event.name}
        studentName={participant.user.name}
        teamName={participant.registration.team?.name}
        code={participant.registration.code}
        when={participant.registration.event.startAt}
        status={participant.registration.status}
        venue={participant.registration.event.venue}
        clubName={participant.registration.event.club.name}
        category={participant.registration.event.category}
      />
      {canCancel && participant.registration.status !== "CANCELLED" ? (
        <form action={async () => { "use server"; await cancelRegistration(participant.registrationId); redirect("/registrations"); }} className="text-center">
          <Button type="submit" variant="ghost">Cancel registration</Button>
        </form>
      ) : null}
    </div>
  );
}
