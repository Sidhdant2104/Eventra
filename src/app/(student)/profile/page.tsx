import Link from "next/link";
import { prisma } from "@/lib/db";
import { profileChecklist } from "@/lib/profile-completion";
import { requireUser } from "@/lib/permissions";
import { yearLabel } from "@/lib/format";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [registrations, teams, certificates] = await Promise.all([
    prisma.registrationParticipant.count({ where: { userId: user.id, registration: { status: { not: "CANCELLED" } } } }),
    prisma.teamMember.count({ where: { userId: user.id } }),
    prisma.certificate.count({ where: { userId: user.id, revokedAt: null } }),
  ]);
  const completion = profileChecklist(user);
  const profile = user.profile;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center overflow-hidden bg-ink text-xl text-white">
            {user.image ? <img src={user.image} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1)}
          </span>
          <div>
            <h1 className="font-display text-5xl">{profile?.preferredName || user.name}</h1>
            <p className="mt-1 text-sm text-secondary">{profile?.department || "Department not set"} · {yearLabel(profile?.year)}</p>
          </div>
        </div>
        <Link href="/profile/edit" className="bg-ink px-4 py-2 text-sm font-medium text-white">Edit profile</Link>
      </div>

      <section className="mt-8 border border-line bg-surface p-5">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-medium">Profile completion</h2>
          <p className="font-display text-4xl">{completion.percent}%</p>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {completion.items.map((item) => (
            <li key={item.key} className="flex justify-between border-t border-line py-2">
              <span>{item.label}</span>
              <span className={item.done ? "text-good" : "text-muted"}>{item.done ? "Done" : "Missing"}</span>
            </li>
          ))}
        </ul>
        {!completion.requiredDone ? <Link href="/onboarding" className="mt-4 inline-block text-sm font-medium">Complete profile</Link> : null}
      </section>

      <section className="mt-8">
        <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">About</h2>
        <p className="mt-2 text-[15px] leading-7 text-secondary">{profile?.bio || "Add a short bio so clubs know who is registering."}</p>
      </section>
      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">Skills</h2>
          <p className="mt-2 text-sm">{profile?.skills || "Not added yet."}</p>
        </div>
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">Interests</h2>
          <p className="mt-2 text-sm">{profile?.interests || "Not added yet."}</p>
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">Links</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {profile?.linkedin ? <li><a href={profile.linkedin}>LinkedIn</a></li> : null}
          {profile?.github ? <li><a href={profile.github}>GitHub</a></li> : null}
          {profile?.portfolioUrl ? <li><a href={profile.portfolioUrl}>Portfolio</a></li> : null}
          {profile?.resumeUrl ? <li><a href={profile.resumeUrl}>Resume</a></li> : null}
          {!profile?.linkedin && !profile?.github && !profile?.portfolioUrl ? <li className="text-muted">No links yet.</li> : null}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">Academics</h2>
        <p className="mt-2 text-sm text-secondary">{profile?.college} · {profile?.department || "Department"} · {yearLabel(profile?.year)} · Division {profile?.division || "—"}</p>
        <p className="mt-1 text-sm text-muted">Roll {profile?.rollNumber || "—"}{profile?.studentId ? ` · ID ${profile.studentId}` : ""}</p>
      </section>
      <section className="mt-8">
        <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">Activity</h2>
        <div className="mt-3 grid grid-cols-3 border border-line">
          <Link href="/registrations" className="border-r border-line px-4 py-4"><span className="block font-display text-3xl">{registrations}</span><span className="text-xs text-muted">Events</span></Link>
          <Link href="/teams" className="border-r border-line px-4 py-4"><span className="block font-display text-3xl">{teams}</span><span className="text-xs text-muted">Teams</span></Link>
          <Link href="/certificates" className="px-4 py-4"><span className="block font-display text-3xl">{certificates}</span><span className="text-xs text-muted">Certificates</span></Link>
        </div>
      </section>
      <p className="mt-8 text-sm"><Link href="/settings" className="font-medium">Account and login methods</Link></p>
    </div>
  );
}
