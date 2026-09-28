"use client";

import { useState, useTransition } from "react";
import { addOrgMember, archiveOrgUnit, createOrgUnit, removeOrgMember } from "@/lib/actions/access";
import { PERMISSIONS, TEAM_PRESETS, isPermission } from "@/lib/access-policy";
import { Alert, Button, Input, Label, Select } from "@/components/ui";

type Person = { userId: string; name: string; email: string | null; lead: boolean };
type Unit = { id: string; name: string; parentId: string | null; permissions: string[]; members: Person[] };

function permissionLabels(keys: string[]) {
  return keys.filter(isPermission).map((key) => PERMISSIONS[key].label);
}

export function AccessBoard({
  scope,
  units,
}: {
  scope: { clubId?: string; eventId?: string; note: string };
  units: Unit[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const roots = units.filter((unit) => !unit.parentId);

  function run(task: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const result = await task();
      if (!result.ok) setError(result.error ?? "That change was not saved.");
    });
  }

  return (
    <div className="space-y-8">
      <p className="max-w-2xl text-sm text-secondary">{scope.note}</p>
      {error ? <Alert>{error}</Alert> : null}
      <form
        className="grid gap-3 border border-line bg-surface p-4 md:grid-cols-[1fr_180px_180px_auto] md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          run(() => createOrgUnit({
            clubId: scope.clubId,
            eventId: scope.eventId,
            parentId: String(data.get("parentId") || ""),
            name: String(data.get("name") || ""),
            preset: String(data.get("preset") || "none"),
          }));
          event.currentTarget.reset();
        }}
      >
        <div>
          <Label htmlFor="team-name">New team</Label>
          <Input id="team-name" name="name" placeholder="Registration" required minLength={2} />
        </div>
        <div>
          <Label htmlFor="team-preset">Access</Label>
          <Select id="team-preset" name="preset" defaultValue="none">
            {TEAM_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="team-parent">Inside</Label>
          <Select id="team-parent" name="parentId" defaultValue="">
            <option value="">Club or event</option>
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
          </Select>
        </div>
        <Button type="submit" disabled={pending}>Create team</Button>
      </form>
      {roots.length === 0 ? <p className="text-sm text-muted">No teams yet. Create one, then add people by their campus email.</p> : null}
      <div className="space-y-4">
        {units.map((unit) => (
          <section key={unit.id} className="border border-line bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{unit.parentId ? `↳ ${unit.name}` : unit.name}</h2>
                <p className="mt-1 text-sm text-secondary">{permissionLabels(unit.permissions).join(" · ") || "No extra access"}</p>
              </div>
              <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run(() => archiveOrgUnit(unit.id))}>Archive</Button>
            </div>
            <ul className="mt-4 divide-y divide-line text-sm">
              {unit.members.map((person) => (
                <li key={person.userId} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium">{person.name}{person.lead ? " · Lead" : ""}</p>
                    <p className="text-muted">{person.email}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => run(() => removeOrgMember(unit.id, person.userId))}>Remove</Button>
                </li>
              ))}
              {unit.members.length === 0 ? <li className="py-2 text-muted">No one on this team yet.</li> : null}
            </ul>
            <form
              className="mt-3 flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                run(() => addOrgMember(unit.id, String(data.get("email") || ""), data.get("lead") === "on"));
                event.currentTarget.reset();
              }}
            >
              <Input name="email" type="email" required placeholder="name@nmiet.edu.in" className="max-w-xs" />
              <label className="flex items-center gap-2 text-sm text-secondary"><input name="lead" type="checkbox" /> Lead</label>
              <Button type="submit" size="sm" disabled={pending}>Add</Button>
            </form>
          </section>
        ))}
      </div>
    </div>
  );
}
