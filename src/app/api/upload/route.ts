import { NextResponse } from "next/server";
import { heldGrants } from "@/lib/authorize";
import { getCurrentUser } from "@/lib/permissions";
import { saveUpload } from "@/lib/storage";

const folders = ["avatars", "resumes", "events", "clubs", "certificates"] as const;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to upload files." }, { status: 401 });
  const form = await request.formData();
  const folder = String(form.get("folder") ?? "");
  const file = form.get("file");
  if (!folders.includes(folder as (typeof folders)[number]) || !(file instanceof File)) {
    return NextResponse.json({ error: "Choose a valid file." }, { status: 400 });
  }
  if (folder !== "avatars" && folder !== "resumes") {
    const grants = await heldGrants(user);
    const allowed = folder === "events"
      ? grants.some((grant) => grant.permission === "EVENT_PAGE_EDIT")
      : folder === "clubs"
        ? grants.some((grant) => grant.permission === "CLUB_EDIT")
        : grants.some((grant) => grant.permission === "CERTIFICATE_ISSUE");
    if (!allowed) return NextResponse.json({ error: "You cannot upload that file." }, { status: 403 });
  }
  try {
    const url = await saveUpload(file, folder as (typeof folders)[number]);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
