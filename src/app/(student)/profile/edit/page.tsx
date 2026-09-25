import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const user = await requireUser();
  if (user.role === "STUDENT" && !user.profile?.department) redirect("/onboarding");
  const [colleges, years, divisions] = await Promise.all([
    prisma.college.findMany({ where: { active: true }, include: { departments: { where: { active: true }, orderBy: { name: "asc" } } }, orderBy: { name: "asc" } }),
    prisma.academicYear.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    prisma.divisionOption.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/profile" className="text-sm text-muted">Profile</Link>
      <h1 className="mt-2 font-display text-5xl">Edit profile</h1>
      <p className="mt-2 text-sm text-secondary">Phone and email are changed from settings, after a verification step.</p>
      <div className="mt-6 border border-line bg-surface p-5">
        <ProfileForm
          options={{ colleges, years, divisions }}
          resumeUrl={user.profile?.resumeUrl}
          initial={{
            name: user.name,
            preferredName: user.profile?.preferredName ?? "",
            college: user.profile?.college ?? "NMIET",
            department: user.profile?.department ?? "",
            year: user.profile?.year ?? "",
            division: user.profile?.division ?? "",
            rollNumber: user.profile?.rollNumber ?? "",
            studentId: user.profile?.studentId ?? "",
            skills: user.profile?.skills ?? "",
            interests: user.profile?.interests ?? "",
            bio: user.profile?.bio ?? "",
            linkedin: user.profile?.linkedin ?? "",
            github: user.profile?.github ?? "",
            portfolio: user.profile?.portfolioUrl ?? "",
          }}
        />
      </div>
    </div>
  );
}
