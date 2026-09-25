import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "Profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ complete?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl">Your profile</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {params.complete ? "Registration needs these details. You only do this once." : "Events reuse this profile. Extra questions, when an event has them, are asked only at registration."}
      </p>
      <div className="mt-6 rounded-3xl border border-line bg-card p-5">
        <ProfileForm
          resumeUrl={user.profile?.resumeUrl}
          initial={{
            name: user.name,
            phone: user.profile?.phone ?? "",
            college: user.profile?.college ?? "NMIET",
            department: user.profile?.department ?? "",
            year: user.profile?.year ?? "",
            division: user.profile?.division ?? "",
            rollNumber: user.profile?.rollNumber ?? "",
            skills: user.profile?.skills ?? "",
            bio: user.profile?.bio ?? "",
            linkedin: user.profile?.linkedin ?? "",
            github: user.profile?.github ?? "",
          }}
        />
      </div>
    </div>
  );
}
