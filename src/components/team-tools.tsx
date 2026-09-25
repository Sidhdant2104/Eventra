"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RegisterForm } from "@/components/register-form";
import { Alert, Button, Card, Input } from "@/components/ui";
import { deleteTeam, inviteTeammate, leaveTeam, removeTeammate, searchStudents } from "@/lib/actions/teams";

type Field = {
  key: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "SELECT" | "URL" | "NUMBER";
  required: boolean;
  options: unknown;
  appliesTo: "SOLO" | "TEAM" | "BOTH";
};

export function TeamTools({
  teamId,
  captain,
  forming,
  inviteLink,
  fields,
  members,
}: {
  teamId: string;
  captain: boolean;
  forming: boolean;
  inviteLink: string;
  fields: Field[];
  members: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!forming) return <p className="text-sm text-muted">This team is registered. Roster changes go through the organizer.</p>;

  return (
    <div className="space-y-4">
      {error ? <Alert>{error}</Alert> : null}
      {captain ? (
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">Invite teammates</h2>
          <form className="flex gap-2" onSubmit={async (event) => {
            event.preventDefault();
            const found = await searchStudents(query);
            setResults(found);
          }}>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" aria-label="Search students" />
            <Button type="submit" variant="outline">Search</Button>
          </form>
          <ul className="space-y-2 text-sm">
            {results.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-2">
                <span>{person.name}<span className="block text-muted">{person.email}</span></span>
                <Button size="sm" type="button" onClick={async () => {
                  const result = await inviteTeammate(teamId, person.email);
                  if (!result.ok) setError(result.error);
                  else router.refresh();
                }}>Invite</Button>
              </li>
            ))}
          </ul>
          <form className="flex gap-2" onSubmit={async (event) => {
            event.preventDefault();
            const email = String(new FormData(event.currentTarget).get("email") ?? "");
            const result = await inviteTeammate(teamId, email);
            if (!result.ok) setError(result.error);
            else {
              setError(null);
              event.currentTarget.reset();
              router.refresh();
            }
          }}>
            <Input name="email" type="email" required placeholder="Email invitation" aria-label="Email invitation" />
            <Button type="submit" variant="outline">Email</Button>
          </form>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <code className="rounded-xl bg-paper px-2 py-1">{inviteLink}</code>
            <Button type="button" size="sm" variant="ghost" onClick={async () => { await navigator.clipboard.writeText(inviteLink); setCopied(true); }}>{copied ? "Copied" : "Copy invite link"}</Button>
          </div>
          <div className="space-y-2">
            {members.map((member) => (
              <button key={member.id} type="button" className="text-sm text-bad" onClick={async () => { await removeTeammate(teamId, member.id); router.refresh(); }}>Remove {member.name}</button>
            ))}
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Register the team</h3>
            <RegisterForm teamId={teamId} fields={fields} mode="TEAM" />
          </div>
          <Button type="button" variant="ghost" onClick={async () => {
            const result = await deleteTeam(teamId);
            if (!result.ok) setError(result.error);
            else router.push("/teams");
          }}>Delete team</Button>
        </Card>
      ) : (
        <Button variant="outline" onClick={async () => {
          const result = await leaveTeam(teamId);
          if (!result.ok) setError(result.error);
          else router.push("/teams");
        }}>Leave team</Button>
      )}
    </div>
  );
}
