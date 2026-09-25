"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { assignStaff, deleteRegistrationField, removeStaff, saveEventSettings, saveRegistrationField, setEventStatus } from "@/lib/actions/events";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { eventSettingsSchema, fieldSchema } from "@/lib/validators";

type Settings = z.infer<typeof eventSettingsSchema>;

export function EventSettingsForm({ eventId, values, clubs }: { eventId: string; values: Settings; clubs: { id: string; name: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<Settings>({ resolver: zodResolver(eventSettingsSchema), defaultValues: values });
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(async (input) => {
      setSaved(false);
      const result = await saveEventSettings(eventId, input);
      if (!result.ok) setError(result.error);
      else {
        setError(null);
        setSaved(true);
        router.refresh();
      }
    })}>
      {error ? <div className="md:col-span-2"><Alert>{error}</Alert></div> : null}
      {saved ? <div className="md:col-span-2"><Alert tone="good">Settings saved.</Alert></div> : null}
      <div><Label>Event name</Label><Input {...form.register("name")} /></div>
      <div><Label>Slug</Label><Input {...form.register("slug")} /></div>
      <div className="md:col-span-2"><Label>Short description</Label><Textarea {...form.register("summary")} /></div>
      <div className="md:col-span-2"><Label>Internal description</Label><Textarea {...form.register("description")} /></div>
      <div className="md:col-span-2"><Label>Cover image URL</Label><Input {...form.register("coverImage")} /></div>
      <div><Label>Starts</Label><Input type="datetime-local" {...form.register("startAt")} /></div>
      <div><Label>Ends</Label><Input type="datetime-local" {...form.register("endAt")} /></div>
      <div><Label>Registration deadline</Label><Input type="datetime-local" {...form.register("registrationDeadline")} /></div>
      <div><Label>Venue</Label><Input {...form.register("venue")} /></div>
      <div><Label>Mode</Label><Select {...form.register("mode")}><option value="OFFLINE">Offline</option><option value="ONLINE">Online</option><option value="HYBRID">Hybrid</option></Select></div>
      <div><Label>Category</Label><Select {...form.register("category")}>{EVENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</Select></div>
      <div><Label>Organizer club</Label><Select {...form.register("clubId")}>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</Select></div>
      <div><Label>Maximum participants</Label><Input {...form.register("maxParticipants")} placeholder="Blank for no cap" /></div>
      <div><Label>Registration type</Label><Select {...form.register("registrationMode")}><option value="SOLO">Solo</option><option value="TEAM">Team</option><option value="BOTH">Solo and team</option></Select></div>
      <div><Label>Minimum team size</Label><Input type="number" {...form.register("minTeamSize", { valueAsNumber: true })} /></div>
      <div><Label>Maximum team size</Label><Input type="number" {...form.register("maxTeamSize", { valueAsNumber: true })} /></div>
      <div><Label>Registration prefix</Label><Input {...form.register("registrationPrefix")} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("featured")} /> Featured on explore</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("allowDuplicate")} /> Allow a student to register more than once</label>
      {form.formState.errors.maxTeamSize ? <p className="text-sm text-bad md:col-span-2">{form.formState.errors.maxTeamSize.message}</p> : null}
      <div className="md:col-span-2"><Button disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving…" : "Save settings"}</Button></div>
    </form>
  );
}

export function PublishControls({ eventId, status }: { eventId: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  async function update(next: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    const result = await setEventStatus(eventId, next);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {error ? <Alert>{error}</Alert> : null}
      {status !== "PUBLISHED" ? <Button onClick={() => update("PUBLISHED")}>Publish</Button> : <Button variant="outline" onClick={() => update("DRAFT")}>Unpublish</Button>}
      <Button variant="ghost" onClick={() => update("ARCHIVED")}>Archive</Button>
    </div>
  );
}

export function FieldManager({ eventId, fields }: { eventId: string; fields: { id: string; label: string; key: string; type: string; required: boolean; appliesTo: string; options: unknown }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {error ? <Alert>{error}</Alert> : null}
      <ul className="space-y-2 text-sm">
        {fields.map((field) => (
          <li key={field.id} className="flex items-center justify-between rounded-2xl bg-paper px-3 py-2">
            <span>{field.label} · {field.key} · {field.type.toLowerCase()} · {field.appliesTo.toLowerCase()} {field.required ? "· required" : ""}</span>
            <button type="button" className="text-bad" onClick={async () => { await deleteRegistrationField(eventId, field.id); router.refresh(); }}>Remove</button>
          </li>
        ))}
        {fields.length === 0 ? <li className="text-muted">No extra questions yet. Profile fields are never asked again.</li> : null}
      </ul>
      <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        const parsed = fieldSchema.safeParse({ ...data, required: data.required === "on" });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Check the field.");
          return;
        }
        const result = await saveRegistrationField(eventId, parsed.data);
        if (!result.ok) setError(result.error);
        else {
          setError(null);
          event.currentTarget.reset();
          router.refresh();
        }
      }}>
        <Input name="label" placeholder="Question label" required />
        <Input name="key" placeholder="key_name" required />
        <Select name="type" defaultValue="TEXT"><option value="TEXT">Text</option><option value="TEXTAREA">Long text</option><option value="URL">URL</option><option value="NUMBER">Number</option><option value="SELECT">Select</option></Select>
        <Select name="appliesTo" defaultValue="BOTH"><option value="BOTH">Solo and team</option><option value="SOLO">Solo only</option><option value="TEAM">Team only</option></Select>
        <Input name="options" placeholder="Options, comma separated" className="md:col-span-2" />
        <label className="flex items-center gap-2 text-sm"><input name="required" type="checkbox" /> Required</label>
        <Button type="submit" variant="outline">Add question</Button>
      </form>
    </div>
  );
}

export function StaffManager({ eventId, staff }: { eventId: string; staff: { userId: string; role: string; user: { name: string; email: string } }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {error ? <Alert>{error}</Alert> : null}
      <ul className="space-y-2 text-sm">
        {staff.map((member) => (
          <li key={member.userId} className="flex items-center justify-between rounded-2xl bg-paper px-3 py-2">
            <span>{member.user.name} · {member.user.email} · {member.role.replaceAll("_", " ").toLowerCase()}</span>
            <button type="button" className="text-bad" onClick={async () => { await removeStaff(eventId, member.userId); router.refresh(); }}>Remove</button>
          </li>
        ))}
      </ul>
      <form className="flex flex-wrap gap-2" onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await assignStaff(eventId, String(data.get("email")), String(data.get("role")) as "EVENT_MANAGER" | "VOLUNTEER");
        if (!result.ok) setError(result.error);
        else {
          setError(null);
          event.currentTarget.reset();
          router.refresh();
        }
      }}>
        <Input name="email" type="email" required placeholder="staff@nmiet.edu.in" className="max-w-xs" />
        <Select name="role" defaultValue="EVENT_MANAGER"><option value="EVENT_MANAGER">Event manager</option><option value="VOLUNTEER">Volunteer</option></Select>
        <Button type="submit" variant="outline">Assign</Button>
      </form>
    </div>
  );
}
