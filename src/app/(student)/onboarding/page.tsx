import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { prisma } from "@/lib/db";
import { isProfileComplete } from "@/lib/profile-completion";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (isProfileComplete(user)) redirect("/home");
  const [colleges, years, divisions] = await Promise.all([
    prisma.college.findMany({ where: { active: true }, include: { departments: { where: { active: true }, orderBy: { name: "asc" } } }, orderBy: { name: "asc" } }),
    prisma.academicYear.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    prisma.divisionOption.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-xl">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Your campus profile</p>
      <h1 className="mt-2 font-display text-5xl">Set up NMIET One.</h1>
      <p className="mt-3 text-sm leading-6 text-secondary">This is the same account no matter how you sign in. You can skip the optional steps and finish them later.</p>
      <div className="mt-8">
        <OnboardingWizard
          options={{ colleges, years, divisions }}
          initial={{
            name: user.name,
            preferredName: user.profile?.preferredName ?? "",
            college: user.profile?.college || colleges[0]?.name || "NMIET",
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
