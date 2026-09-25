"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Input, Label, Select } from "@/components/ui";
import { generateCertificates, revokeCertificate, saveCertificateTemplate } from "@/lib/actions/certificates";

type CertificateKind = "PARTICIPATION" | "WINNER" | "RUNNER_UP" | "VOLUNTEER" | "CUSTOM";
const types: CertificateKind[] = ["PARTICIPATION", "WINNER", "RUNNER_UP", "VOLUNTEER", "CUSTOM"];

export function CertificateManager({
  eventId,
  templates,
  people,
  issued,
}: {
  eventId: string;
  templates: { id: string; name: string; type: string }[];
  people: { id: string; name: string; status: string }[];
  issued: { id: string; publicId: string; name: string; type: string; revoked: boolean }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="good">{message}</Alert> : null}
      <form className="grid gap-3 rounded-3xl border border-line bg-card p-4 md:grid-cols-2" onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const file = data.get("background");
        let backgroundUrl = String(data.get("backgroundUrl") ?? "");
        if (file instanceof File && file.size > 0) {
          const body = new FormData();
          body.set("file", file);
          body.set("folder", "certificates");
          const response = await fetch("/api/upload", { method: "POST", body });
          const json = await response.json();
          if (!response.ok) {
            setError(json.error ?? "Upload failed");
            return;
          }
          backgroundUrl = json.url;
        }
        const result = await saveCertificateTemplate(eventId, {
          name: String(data.get("name")),
          type: String(data.get("type")) as CertificateKind,
          backgroundUrl,
          nameY: Number(data.get("nameY") || 46),
          metaY: Number(data.get("metaY") || 62),
        });
        if (!result.ok) setError(result.error);
        else {
          setError(null);
          setMessage("Template saved.");
          router.refresh();
        }
      }}>
        <h2 className="font-semibold md:col-span-2">Certificate template</h2>
        <div><Label>Name</Label><Input name="name" required placeholder="Participation" /></div>
        <div><Label>Type</Label><Select name="type" defaultValue="PARTICIPATION">{types.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ").toLowerCase()}</option>)}</Select></div>
        <div><Label>Name position (%)</Label><Input name="nameY" type="number" min={20} max={80} defaultValue={46} /></div>
        <div><Label>Details position (%)</Label><Input name="metaY" type="number" min={30} max={90} defaultValue={62} /></div>
        <div className="md:col-span-2"><Label>Background image</Label><Input name="background" type="file" accept="image/*" /></div>
        <div className="md:col-span-2"><Button type="submit" variant="outline">Save template</Button></div>
      </form>
      <form className="rounded-3xl border border-line bg-card p-4" onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await generateCertificates(eventId, String(data.get("templateId")), data.getAll("userId").map(String));
        if (!result.ok) setError(result.error);
        else {
          setError(null);
          setMessage(`Issued ${result.created}. Skipped ${result.skipped}. Ineligible ${result.missing}.`);
          router.refresh();
        }
      }}>
        <h2 className="font-semibold">Generate</h2>
        <Select name="templateId" className="mt-3" required defaultValue="">
          <option value="" disabled>Choose a template</option>
          {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
        </Select>
        <ul className="mt-3 max-h-64 space-y-1 overflow-auto text-sm">
          {people.map((person) => (
            <li key={person.id}><label className="flex gap-2"><input type="checkbox" name="userId" value={person.id} />{person.name} · {person.status.toLowerCase()}</label></li>
          ))}
        </ul>
        <Button className="mt-3" type="submit">Generate selected</Button>
      </form>
      <ul className="space-y-2 text-sm">
        {issued.map((certificate) => (
          <li key={certificate.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card px-3 py-2">
            <span>{certificate.name} · {certificate.publicId} · {certificate.type.toLowerCase()} {certificate.revoked ? "· revoked" : ""}</span>
            <button type="button" onClick={async () => { await revokeCertificate(eventId, certificate.id, !certificate.revoked); router.refresh(); }}>{certificate.revoked ? "Restore" : "Revoke"}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
