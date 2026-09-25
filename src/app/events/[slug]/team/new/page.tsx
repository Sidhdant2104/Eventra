"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Input, Label } from "@/components/ui";
import { createTeam } from "@/lib/actions/teams";

export default function NewTeamPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <main id="content" className="mx-auto max-w-lg px-4 py-12">
      <Link href={`/events/${params.slug}`} className="text-sm font-medium">Back to event</Link>
      <h1 className="mt-4 font-display text-5xl">Create a team</h1>
      <p className="mt-2 text-sm text-muted">You will be captain. Invite members, then register the whole team in one step.</p>
      <form className="mt-6 space-y-4" onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const name = String(new FormData(event.currentTarget).get("name") ?? "");
        const result = await createTeam(params.slug, name);
        setPending(false);
        if (!result.ok) {
          if ("code" in result && result.code === "PROFILE") router.push("/profile?complete=1");
          setError(result.error);
          return;
        }
        router.push(`/teams/${result.teamId}`);
      }}>
        {error ? <Alert>{error}</Alert> : null}
        <div><Label htmlFor="name">Team name</Label><Input id="name" name="name" required minLength={2} maxLength={40} placeholder="Code Warriors" /></div>
        <Button disabled={pending}>{pending ? "Creating…" : "Create team"}</Button>
      </form>
    </main>
  );
}
