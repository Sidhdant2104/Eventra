"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EventPageView } from "@/components/event-page";
import { saveEventSections } from "@/lib/actions/events";
import { BLOCK_LABELS, BLOCK_TYPES, defaultContent, type BlockType, type EditorSection } from "@/lib/blocks";
import { Button, Input, Textarea } from "@/components/ui";

type PreviewEvent = {
  name: string;
  slug: string;
  summary: string;
  coverImage: string | null;
  startAt: string;
  endAt: string;
  registrationDeadline: string;
  venue: string | null;
  mode: string;
  category: string;
  registrationMode: string;
  status: string;
  clubName: string;
};

export function BlockEditor({ eventId, slug, initial, preview }: { eventId: string; slug: string; initial: EditorSection[]; preview: PreviewEvent }) {
  const [sections, setSections] = useState<EditorSection[]>(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const active = sections.find((section) => section.id === activeId) ?? sections[0];

  function update(content: Record<string, unknown>) {
    if (!active) return;
    setSections((current) => current.map((section) => section.id === active.id ? { ...section, content: { ...section.content, ...content } } : section));
  }

  function move(id: string, direction: -1 | 1) {
    setSections((current) => {
      const index = current.findIndex((section) => section.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item!);
      return copy;
    });
  }

  async function save() {
    setPending(true);
    const result = await saveEventSections(eventId, sections);
    setPending(false);
    if (!result.ok) toast.error(result.error);
    else toast.success("Event page saved");
  }

  function duplicate(id: string) {
    const index = sections.findIndex((section) => section.id === id);
    if (index < 0) return;
    const source = sections[index]!;
    const copy = { ...source, id: crypto.randomUUID(), content: structuredClone(source.content) };
    const next = [...sections];
    next.splice(index + 1, 0, copy);
    setSections(next);
    setActiveId(copy.id);
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setSections((current) => {
      const from = current.findIndex((section) => section.id === dragId);
      const to = current.findIndex((section) => section.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      return next;
    });
    setDragId(null);
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
      <div className="space-y-3 xl:sticky xl:top-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Blocks</p>
        <label className="sr-only" htmlFor="add-block">Add block</label>
        <select
          id="add-block"
          className="w-full border border-line bg-surface px-3 py-2 text-sm"
          defaultValue=""
          onChange={(event) => {
            const type = event.target.value as BlockType;
            if (!type) return;
            const section = { id: crypto.randomUUID(), type, visible: true, content: defaultContent(type) };
            setSections((current) => [...current, section]);
            setActiveId(section.id);
            event.target.value = "";
          }}
        >
          <option value="">Add block</option>
          {BLOCK_TYPES.map((type) => <option key={type} value={type}>{BLOCK_LABELS[type]}</option>)}
        </select>
        <ul className="space-y-1">
          {sections.map((section, index) => (
            <li key={section.id} draggable onDragStart={() => setDragId(section.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropOn(section.id)}>
              <button type="button" onClick={() => setActiveId(section.id)} className={`w-full px-3 py-2 text-left text-sm ${section.id === active?.id ? "bg-ink text-white" : "bg-surface"}`}>
                <span className="block font-medium">{BLOCK_LABELS[section.type]}</span>
                <span className={`text-xs ${section.id === active?.id ? "text-white/60" : "text-muted"}`}>{section.visible ? "Visible" : "Hidden"} · {index + 1}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0 overflow-hidden border border-line bg-background xl:max-h-[calc(100vh-8rem)] xl:overflow-auto">
        <p className="border-b border-line px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-muted">Live preview</p>
        <div className="origin-top scale-100">
          <EventPageView
            preview
            loggedIn
            event={{
              ...preview,
              club: { name: preview.clubName },
              sections,
            }}
          />
        </div>
      </div>
      <div className="border border-line bg-surface p-4 xl:sticky xl:top-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save page"}</Button>
          <Button type="button" variant="outline" onClick={() => window.open(`/events/${slug}`, "_blank")}>Open</Button>
        </div>
        {active ? (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => move(active.id, -1)}>Up</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => move(active.id, 1)}>Down</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => duplicate(active.id)}>Duplicate</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSections((current) => current.map((section) => section.id === active.id ? { ...section, visible: !section.visible } : section))}>
                {active.visible ? "Hide" : "Show"}
              </Button>
              <Button type="button" size="sm" variant="danger" onClick={() => {
                setSections((current) => current.filter((section) => section.id !== active.id));
                setActiveId("");
              }}>Delete</Button>
            </div>
            <BlockFields section={active} onChange={update} />
          </>
        ) : <p className="text-sm text-muted">Add a block to start the page.</p>}
      </div>
    </div>
  );
}

function BlockFields({ section, onChange }: { section: EditorSection; onChange: (content: Record<string, unknown>) => void }) {
  const content = section.content;
  const value = (key: string) => (typeof content[key] === "string" ? content[key] : "");
  if (section.type === "RULES") {
    const rules = Array.isArray(content.rules) ? content.rules.map(String) : [];
    return (
      <div className="space-y-3">
        <Field label="Heading" value={value("heading")} onChange={(heading) => onChange({ heading })} />
        <label className="block text-sm font-medium">One rule per line
          <Textarea className="mt-1.5" value={rules.join("\n")} onChange={(event) => onChange({ rules: event.target.value.split("\n") })} />
        </label>
      </div>
    );
  }
  const scalarKeys = scalarFields(section.type);
  const listKey = listField(section.type);
  return (
    <div className="space-y-4">
      {scalarKeys.map((field) => field.kind === "image" ? (
        <ImageField key={field.key} label={field.label} value={value(field.key)} onChange={(next) => onChange({ [field.key]: next })} />
      ) : field.kind === "area" ? (
        <label key={field.key} className="block text-sm font-medium">{field.label}
          <Textarea className="mt-1.5" value={value(field.key)} onChange={(event) => onChange({ [field.key]: event.target.value })} />
        </label>
      ) : (
        <Field key={field.key} label={field.label} value={value(field.key)} onChange={(next) => onChange({ [field.key]: next })} />
      ))}
      {listKey ? (
        <Repeater
          label={listKey.label}
          items={Array.isArray(content[listKey.key]) ? content[listKey.key] as Record<string, string>[] : []}
          fields={listKey.fields}
          blank={listKey.blank}
          onChange={(items) => onChange({ [listKey.key]: items })}
        />
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium">{label}
      <Input className="mt-1.5" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [uploading, setUploading] = useState(false);
  return (
    <div>
      <Field label={label} value={value} onChange={onChange} />
      <label className="mt-2 inline-flex cursor-pointer text-sm font-medium text-brand">
        {uploading ? "Uploading…" : "Upload image"}
        <input type="file" accept="image/*" className="sr-only" onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setUploading(true);
          const body = new FormData();
          body.set("file", file);
          body.set("folder", "events");
          const response = await fetch("/api/upload", { method: "POST", body });
          const json = await response.json();
          setUploading(false);
          if (json.url) onChange(json.url);
          else toast.error(json.error ?? "Upload failed");
        }} />
      </label>
    </div>
  );
}

function Repeater({ label, items, fields, blank, onChange }: {
  label: string;
  items: Record<string, string>[];
  fields: { key: string; label: string; area?: boolean }[];
  blank: Record<string, string>;
  onChange: (items: Record<string, string>[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, blank])}>Add</Button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-2xl border border-line p-3">
          {fields.map((field) => field.area ? (
            <label key={field.key} className="block text-sm">{field.label}
              <Textarea className="mt-1" value={item[field.key] ?? ""} onChange={(event) => {
                const next = [...items];
                next[index] = { ...item, [field.key]: event.target.value };
                onChange(next);
              }} />
            </label>
          ) : (
            <Field key={field.key} label={field.label} value={item[field.key] ?? ""} onChange={(value) => {
              const next = [...items];
              next[index] = { ...item, [field.key]: value };
              onChange(next);
            }} />
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
        </div>
      ))}
    </div>
  );
}

function scalarFields(type: BlockType): { key: string; label: string; kind?: "area" | "image" }[] {
  switch (type) {
    case "HERO":
      return [{ key: "eyebrow", label: "Eyebrow" }, { key: "title", label: "Title" }, { key: "subtitle", label: "Subtitle", kind: "area" }, { key: "image", label: "Background image", kind: "image" }];
    case "ABOUT":
      return [{ key: "heading", label: "Heading" }, { key: "body", label: "Body", kind: "area" }, { key: "image", label: "Image", kind: "image" }];
    case "RICH_TEXT":
      return [{ key: "heading", label: "Heading" }, { key: "body", label: "Body", kind: "area" }];
    case "IMAGE":
      return [{ key: "url", label: "Image", kind: "image" }, { key: "alt", label: "Alt text" }, { key: "caption", label: "Caption" }];
    case "GALLERY":
    case "SPEAKERS":
    case "TIMELINE":
    case "PRIZES":
    case "FAQS":
    case "SPONSORS":
    case "ORGANIZERS":
      return [{ key: "heading", label: "Heading" }];
    case "VIDEO":
      return [{ key: "heading", label: "Heading" }, { key: "url", label: "YouTube or Vimeo URL" }, { key: "caption", label: "Caption" }];
    case "CONTACT":
      return [{ key: "heading", label: "Heading" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "location", label: "Location" }, { key: "note", label: "Note", kind: "area" }];
    case "REGISTRATION_CTA":
      return [{ key: "heading", label: "Heading" }, { key: "body", label: "Body", kind: "area" }, { key: "buttonLabel", label: "Button label" }];
    default:
      return [];
  }
}

function listField(type: BlockType): { key: string; label: string; blank: Record<string, string>; fields: { key: string; label: string; area?: boolean }[] } | null {
  switch (type) {
    case "GALLERY":
      return { key: "images", label: "Images", blank: { url: "", alt: "" }, fields: [{ key: "url", label: "Image URL" }, { key: "alt", label: "Alt text" }] };
    case "SPEAKERS":
      return { key: "people", label: "Speakers", blank: { name: "", role: "", bio: "", image: "" }, fields: [{ key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "bio", label: "Bio", area: true }, { key: "image", label: "Image URL" }] };
    case "TIMELINE":
      return { key: "items", label: "Moments", blank: { time: "", title: "", description: "" }, fields: [{ key: "time", label: "Time" }, { key: "title", label: "Title" }, { key: "description", label: "Description", area: true }] };
    case "PRIZES":
      return { key: "prizes", label: "Prizes", blank: { place: "", title: "", reward: "", description: "" }, fields: [{ key: "place", label: "Place" }, { key: "title", label: "Title" }, { key: "reward", label: "Reward" }, { key: "description", label: "Description" }] };
    case "FAQS":
      return { key: "items", label: "Questions", blank: { question: "", answer: "" }, fields: [{ key: "question", label: "Question" }, { key: "answer", label: "Answer", area: true }] };
    case "SPONSORS":
      return { key: "sponsors", label: "Sponsors", blank: { name: "", logo: "", tier: "" }, fields: [{ key: "name", label: "Name" }, { key: "tier", label: "Tier" }, { key: "logo", label: "Logo URL" }] };
    case "ORGANIZERS":
      return { key: "people", label: "People", blank: { name: "", role: "", image: "" }, fields: [{ key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "image", label: "Image URL" }] };
    default:
      return null;
  }
}
