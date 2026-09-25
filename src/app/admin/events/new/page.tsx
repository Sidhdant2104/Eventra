"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Input, Label, Select } from "@/components/ui";
import { createEvent } from "@/lib/actions/events";

export default function NewEventPage() {
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void fetch("/api/clubs").then((response) => response.json()).then((data) => setClubs(data.clubs ?? []));
  }, []);
  return (
    <div className="max-w-lg">
      <h1 className="font-display text-5xl">New event</h1>
      <p className="mt-2 text-sm text-muted">This creates a draft with a starter page. Design the sections next.</p>
      <form className="mt-6 space-y-4" action={async (formData) => {
        const result = await createEvent(String(formData.get("clubId")), String(formData.get("name")));
        if (result && !result.ok) setError(result.error);
      }}>
        {error ? <Alert>{error}</Alert> : null}
        <div><Label htmlFor="name">Event name</Label><Input id="name" name="name" required /></div>
        <div>
          <Label htmlFor="clubId">Club</Label>
          <Select id="clubId" name="clubId" required defaultValue="">
            <option value="" disabled>Select a club</option>
            {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
          </Select>
        </div>
        <Button type="submit">Create draft</Button>
      </form>
    </div>
  );
}
