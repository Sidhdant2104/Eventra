"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { addClubMember, createClub, removeClubMember, updateClub } from "@/lib/actions/clubs";

export function ClubEditor({
  club,
  members,
}: {
  club?: { id: string; name: string; slug: string; description: string | null };
  members?: { userId: string; role: string; user: { name: string; email: string } }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      {error ? <Alert>{error}</Alert> : null}
      <form className="space-y-3" onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const input = { name: String(data.get("name")), slug: String(data.get("slug")), description: String(data.get("description") ?? "") };
        const file = data.get("logo");
        let logo: string | undefined;
        if (file instanceof File && file.size > 0) {
          const body = new FormData();
          body.set("file", file);
          body.set("folder", "clubs");
          const response = await fetch("/api/upload", { method: "POST", body });
          const json = await response.json();
          if (!response.ok) {
            setError(json.error ?? "Upload failed");
            return;
          }
          logo = json.url;
        }
        const result = club ? await updateClub(club.id, input, logo) : await createClub(input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if ("id" in result) router.push(`/admin/clubs/${result.id}`);
        else router.refresh();
      }}>
        <div><Label>Name</Label><Input name="name" required defaultValue={club?.name} /></div>
        <div><Label>Slug</Label><Input name="slug" required defaultValue={club?.slug} /></div>
        <div><Label>Description</Label><Textarea name="description" defaultValue={club?.description ?? ""} /></div>
        {club ? <div><Label>Logo</Label><Input name="logo" type="file" accept="image/*" /></div> : null}
        <Button type="submit">{club ? "Save club" : "Create club"}</Button>
      </form>
      {club && members ? (
        <div className="space-y-3">
          <h2 className="font-semibold">Members</h2>
          <ul className="space-y-2 text-sm">
            {members.map((member) => (
              <li key={member.userId} className="flex justify-between gap-2">
                <span>{member.user.name} · {member.user.email} · {member.role.replaceAll("_", " ").toLowerCase()}</span>
                <button type="button" className="text-bad" onClick={async () => { await removeClubMember(club.id, member.userId); router.refresh(); }}>Remove</button>
              </li>
            ))}
          </ul>
          <form className="flex flex-wrap gap-2" onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const result = await addClubMember(club.id, String(data.get("email")), String(data.get("role")) as "CLUB_ADMIN" | "MEMBER");
            if (!result.ok) setError(result.error);
            else {
              setError(null);
              router.refresh();
            }
          }}>
            <Input name="email" type="email" required placeholder="member@nmiet.edu.in" />
            <Select name="role" defaultValue="CLUB_ADMIN"><option value="CLUB_ADMIN">Club admin</option><option value="MEMBER">Member</option></Select>
            <Button type="submit" variant="outline">Add</Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
