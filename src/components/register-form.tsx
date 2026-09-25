"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { registerSolo } from "@/lib/actions/registration";
import { registerTeam } from "@/lib/actions/teams";

type Field = {
  key: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "SELECT" | "URL" | "NUMBER";
  required: boolean;
  options: unknown;
  appliesTo: "SOLO" | "TEAM" | "BOTH";
};

export function RegisterForm({
  slug,
  teamId,
  fields,
  mode,
}: {
  slug?: string;
  teamId?: string;
  fields: Field[];
  mode: "SOLO" | "TEAM";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const relevant = fields.filter((field) => field.appliesTo === "BOTH" || field.appliesTo === mode);

  return (
    <form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      setError(null);
      const data = new FormData(event.currentTarget);
      const responses: Record<string, string> = {};
      for (const field of relevant) responses[field.key] = String(data.get(field.key) ?? "");
      const result = teamId ? await registerTeam(teamId, responses) : await registerSolo(slug ?? "", responses);
      setPending(false);
      if (!result.ok) {
        if ("code" in result && result.code === "PROFILE") router.push("/profile?complete=1");
        setError(result.error);
        return;
      }
      if ("participantId" in result && result.participantId) router.push(`/registrations/${result.participantId}?ready=1`);
      else router.push("/registrations?ready=1");
      router.refresh();
    }}>
      {error ? <Alert>{error}</Alert> : null}
      {relevant.length === 0 ? <p className="text-sm text-muted">Nothing else is required. Confirm to register with your saved profile.</p> : null}
      {relevant.map((field) => {
        const options = Array.isArray(field.options) ? field.options.map(String) : [];
        return (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}{field.required ? " *" : ""}</Label>
            {field.type === "TEXTAREA" ? <Textarea id={field.key} name={field.key} required={field.required} /> : null}
            {field.type === "SELECT" ? (
              <Select id={field.key} name={field.key} required={field.required} defaultValue="">
                <option value="" disabled>Select</option>
                {options.map((option) => <option key={option}>{option}</option>)}
              </Select>
            ) : null}
            {field.type !== "TEXTAREA" && field.type !== "SELECT" ? (
              <Input id={field.key} name={field.key} required={field.required} type={field.type === "NUMBER" ? "number" : field.type === "URL" ? "url" : "text"} />
            ) : null}
          </div>
        );
      })}
      <Button disabled={pending}>{pending ? "Registering…" : mode === "TEAM" ? "Register team" : "Confirm registration"}</Button>
    </form>
  );
}
