import { redirect } from "next/navigation";
import { ClubEditor } from "@/components/club-form";
import { requireUser } from "@/lib/permissions";

export default async function NewClubPage() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/admin/clubs");
  return (
    <div className="max-w-xl">
      <h1 className="mb-4 font-display text-5xl">New club</h1>
      <ClubEditor />
    </div>
  );
}
