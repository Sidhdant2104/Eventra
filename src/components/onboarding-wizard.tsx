"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { saveOnboardingAbout, saveOnboardingAcademic, saveOnboardingBasic, saveOnboardingLinks } from "@/lib/actions/profile";
import type { AcademicOptions } from "@/components/profile-form";

const steps = ["You", "Academics", "About", "Links", "Review"];

export function OnboardingWizard({
  options,
  initial,
}: {
  options: AcademicOptions;
  initial: {
    name: string;
    preferredName: string;
    image?: string | null;
    college: string;
    department: string;
    year: string;
    division: string;
    rollNumber: string;
    studentId: string;
    skills: string;
    interests: string;
    bio: string;
    linkedin: string;
    github: string;
    portfolio: string;
  };
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState(initial);
  const departments = options.colleges.find((college) => college.name === draft.college)?.departments ?? [];

  async function next(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    let result: { ok: boolean; error?: string } = { ok: true };
    if (step === 0) {
      const files = new FormData();
      const photo = form.get("photo");
      if (photo instanceof File && photo.size > 0) files.set("photo", photo);
      result = await saveOnboardingBasic({ name: String(form.get("name") ?? ""), preferredName: String(form.get("preferredName") ?? "") }, files);
      if (result.ok) setDraft((current) => ({ ...current, name: String(form.get("name") ?? ""), preferredName: String(form.get("preferredName") ?? "") }));
    } else if (step === 1) {
      const values = {
        college: String(form.get("college") ?? ""),
        department: String(form.get("department") ?? ""),
        year: String(form.get("year") ?? ""),
        division: String(form.get("division") ?? ""),
        rollNumber: String(form.get("rollNumber") ?? ""),
        studentId: String(form.get("studentId") ?? ""),
      };
      result = await saveOnboardingAcademic(values);
      if (result.ok) setDraft((current) => ({ ...current, ...values }));
    } else if (step === 2) {
      const values = { skills: String(form.get("skills") ?? ""), interests: String(form.get("interests") ?? ""), bio: String(form.get("bio") ?? "") };
      result = await saveOnboardingAbout(values);
      if (result.ok) setDraft((current) => ({ ...current, ...values }));
    } else if (step === 3) {
      const values = { linkedin: String(form.get("linkedin") ?? ""), github: String(form.get("github") ?? ""), portfolio: String(form.get("portfolio") ?? "") };
      result = await saveOnboardingLinks(values);
      if (result.ok) setDraft((current) => ({ ...current, ...values }));
    } else {
      setPending(false);
      return;
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save that step.");
      return;
    }
    setStep((current) => current + 1);
  }

  return (
    <form className="space-y-6" onSubmit={next}>
      <ol className="flex flex-wrap gap-3 text-[12px] uppercase tracking-[0.14em] text-muted">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? "text-ink" : ""}>{index + 1}. {label}</li>
        ))}
      </ol>
      {error ? <Alert>{error}</Alert> : null}
      {step === 0 ? (
        <div className="space-y-4">
          <div><Label htmlFor="name">Full name</Label><Input id="name" name="name" defaultValue={draft.name === "Student" ? "" : draft.name} required /></div>
          <div><Label htmlFor="preferredName">Preferred name</Label><Input id="preferredName" name="preferredName" defaultValue={draft.preferredName} /></div>
          <div><Label htmlFor="photo">Profile photo</Label><Input id="photo" name="photo" type="file" accept="image/*" /></div>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="college">College</Label>
            <Select id="college" name="college" defaultValue={draft.college} onChange={(event) => setDraft((current) => ({ ...current, college: event.target.value, department: "" }))}>
              {options.colleges.map((college) => <option key={college.name}>{college.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Select id="department" name="department" defaultValue={draft.department} key={draft.college}>
              <option value="">Select</option>
              {departments.map((department) => <option key={department.name}>{department.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="year">Year</Label>
            <Select id="year" name="year" defaultValue={draft.year}>
              <option value="">Select</option>
              {options.years.map((year) => <option key={year.code} value={year.code}>{year.label}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="division">Division</Label>
            <Select id="division" name="division" defaultValue={draft.division}>
              <option value="">Select</option>
              {options.divisions.map((division) => <option key={division.name}>{division.name}</option>)}
            </Select>
          </div>
          <div><Label htmlFor="rollNumber">Roll number</Label><Input id="rollNumber" name="rollNumber" defaultValue={draft.rollNumber} required /></div>
          <div><Label htmlFor="studentId">Student ID</Label><Input id="studentId" name="studentId" defaultValue={draft.studentId} /></div>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="space-y-4">
          <div><Label htmlFor="skills">Skills</Label><Input id="skills" name="skills" defaultValue={draft.skills} /></div>
          <div><Label htmlFor="interests">Interests</Label><Input id="interests" name="interests" defaultValue={draft.interests} /></div>
          <div><Label htmlFor="bio">Bio</Label><Textarea id="bio" name="bio" defaultValue={draft.bio} /></div>
          <button type="button" className="text-sm text-muted" onClick={() => setStep(3)}>Skip for now</button>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="space-y-4">
          <div><Label htmlFor="linkedin">LinkedIn</Label><Input id="linkedin" name="linkedin" defaultValue={draft.linkedin} placeholder="https://" /></div>
          <div><Label htmlFor="github">GitHub</Label><Input id="github" name="github" defaultValue={draft.github} placeholder="https://" /></div>
          <div><Label htmlFor="portfolio">Portfolio</Label><Input id="portfolio" name="portfolio" defaultValue={draft.portfolio} placeholder="https://" /></div>
          <button type="button" className="text-sm text-muted" onClick={() => setStep(4)}>Skip for now</button>
        </div>
      ) : null}
      {step === 4 ? (
        <dl className="space-y-3 text-sm">
          <div><dt className="text-muted">Name</dt><dd>{draft.preferredName || draft.name}</dd></div>
          <div><dt className="text-muted">Academics</dt><dd>{draft.department || "Not set"} · {draft.year || "Year"} · {draft.division || "Division"}</dd></div>
          <div><dt className="text-muted">Roll number</dt><dd>{draft.rollNumber || "Not set"}</dd></div>
          <div><dt className="text-muted">About</dt><dd>{draft.bio || draft.skills || "You can add this later."}</dd></div>
        </dl>
      ) : null}
      <div className="flex gap-3">
        {step > 0 ? <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>Back</Button> : null}
        {step === 4 ? (
          <Button type="button" onClick={() => { router.push("/home"); router.refresh(); }}>Complete profile</Button>
        ) : (
          <Button disabled={pending}>{pending ? "Saving…" : "Continue"}</Button>
        )}
      </div>
    </form>
  );
}
