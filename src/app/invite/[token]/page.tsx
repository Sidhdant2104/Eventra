"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button } from "@/components/ui";
import { acceptInviteLink } from "@/lib/actions/teams";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <main id="content" className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Team invitation</p>
      <h1 className="mt-3 font-display text-5xl">Join this team?</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Accepting adds you to the roster. The captain registers the team, so you do not submit a separate form.</p>
      {error ? <div className="mt-4"><Alert>{error}</Alert></div> : null}
      <div className="mt-6 flex gap-2">
        <Button disabled={pending} onClick={async () => {
          setPending(true);
          const result = await acceptInviteLink(params.token, true);
          setPending(false);
          if (!result.ok) {
            if ("code" in result && result.code === "PROFILE") router.push("/profile?complete=1");
            setError(result.error);
            return;
          }
          router.push(`/teams/${result.teamId}`);
        }}>Accept</Button>
        <Button variant="outline" onClick={async () => {
          const result = await acceptInviteLink(params.token, false);
          if (!result.ok) setError(result.error);
          else router.push("/teams");
        }}>Decline</Button>
      </div>
      <p className="mt-6 text-sm"><Link href={`/login?callbackUrl=/invite/${params.token}`}>Sign in</Link> if this is a different account.</p>
    </main>
  );
}
