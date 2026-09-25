"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { sendAnnouncement } from "@/lib/actions/announcements";
import { formatWhen } from "@/lib/format";

export function AnnouncementForm({
  eventId,
  people,
  history,
}: {
  eventId: string;
  people: { id: string; name: string }[];
  history: { id: string; title: string; body: string; audience: string; createdAt: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  return (
    <div className="space-y-6">
      <form className="space-y-3 rounded-3xl border border-line bg-card p-4" onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await sendAnnouncement(eventId, {
          title: String(data.get("title")),
          body: String(data.get("body")),
          audience: String(data.get("audience")) as "ALL_REGISTERED" | "CAPTAINS" | "ATTENDEES" | "SPECIFIC",
          kind: String(data.get("kind")) as "ANNOUNCEMENT",
          userIds: data.getAll("userId").map(String),
        });
        if (!result.ok) setError(result.error);
        else {
          setError(null);
          setSent(result.sent);
          router.refresh();
        }
      }}>
        {error ? <Alert>{error}</Alert> : null}
        {sent != null ? <Alert tone="good">Sent to {sent} people.</Alert> : null}
        <div><Label>Title</Label><Input name="title" required placeholder="Venue has changed" /></div>
        <div><Label>Message</Label><Textarea name="body" required placeholder="Venue has changed to Seminar Hall 2." /></div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Audience</Label>
            <Select name="audience" defaultValue="ALL_REGISTERED">
              <option value="ALL_REGISTERED">All registered participants</option>
              <option value="CAPTAINS">Team captains</option>
              <option value="ATTENDEES">Checked-in attendees</option>
              <option value="SPECIFIC">Specific participants</option>
            </Select>
          </div>
          <div>
            <Label>Kind</Label>
            <Select name="kind" defaultValue="ANNOUNCEMENT">
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="VENUE_CHANGED">Venue changed</option>
              <option value="EVENT_UPDATE">Event update</option>
              <option value="EVENT_REMINDER">Reminder</option>
              <option value="DEADLINE_APPROACHING">Deadline approaching</option>
            </Select>
          </div>
        </div>
        <details>
          <summary className="cursor-pointer text-sm font-medium">Choose specific people</summary>
          <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-sm">
            {people.map((person) => <li key={person.id}><label className="flex gap-2"><input type="checkbox" name="userId" value={person.id} />{person.name}</label></li>)}
          </ul>
        </details>
        <Button type="submit">Send announcement</Button>
      </form>
      <ul className="space-y-2">
        {history.map((item) => (
          <li key={item.id} className="rounded-2xl bg-card p-4">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted">{item.body}</p>
            <p className="mt-1 text-xs text-muted">{item.audience.replaceAll("_", " ").toLowerCase()} · {formatWhen(item.createdAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
