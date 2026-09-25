import { notFound } from "next/navigation";
import { PassCard } from "@/components/pass-card";
import { prisma } from "@/lib/db";

export default async function PublicPassPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const pass = await prisma.qrPass.findUnique({
    where: { token },
    include: { participant: { include: { user: true, registration: { include: { event: true, team: true } } } } },
  });
  if (!pass) notFound();
  return (
    <main id="content" className="min-h-screen bg-ink px-4 py-8">
      <PassCard
        token={pass.token}
        eventName={pass.participant.registration.event.name}
        studentName={pass.participant.user.name}
        teamName={pass.participant.registration.team?.name}
        code={pass.participant.registration.code}
        when={pass.participant.registration.event.startAt}
        status={pass.participant.registration.status}
      />
    </main>
  );
}
