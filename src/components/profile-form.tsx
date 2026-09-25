"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { updateProfile } from "@/lib/actions/profile";
import { profileSchema } from "@/lib/validators";

type Values = z.infer<typeof profileSchema>;
export type AcademicOptions = {
  colleges: { name: string; departments: { name: string }[] }[];
  years: { code: string; label: string }[];
  divisions: { name: string }[];
};

export function ProfileForm({ initial, resumeUrl, options }: { initial: Values; resumeUrl?: string | null; options: AcademicOptions }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(profileSchema), defaultValues: initial });
  const college = form.watch("college");
  const departments = useMemo(
    () => options.colleges.find((item) => item.name === college)?.departments ?? [],
    [options.colleges, college],
  );

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (values, event) => {
      const submitted = event?.currentTarget instanceof HTMLFormElement ? new FormData(event.currentTarget) : new FormData();
      setError(null);
      setMessage(null);
      const files = new FormData();
      const photo = submitted.get("photo");
      const resume = submitted.get("resume");
      if (photo instanceof File && photo.size > 0) files.set("photo", photo);
      if (resume instanceof File && resume.size > 0) files.set("resume", resume);
      const result = await updateProfile(values, files);
      if (!result.ok) setError(result.error);
      else setMessage("Profile saved.");
    })}>
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="good">{message}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label htmlFor="name">Full name</Label><Input id="name" {...form.register("name")} /></div>
        <div><Label htmlFor="preferredName">Preferred name</Label><Input id="preferredName" {...form.register("preferredName")} /></div>
        <div>
          <Label htmlFor="college">College</Label>
          <Select id="college" {...form.register("college")}>
            <option value="">Select</option>
            {options.colleges.map((item) => <option key={item.name}>{item.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Select id="department" {...form.register("department")}>
            <option value="">Select</option>
            {departments.map((item) => <option key={item.name}>{item.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <Select id="year" {...form.register("year")}>
            <option value="">Select</option>
            {options.years.map((year) => <option key={year.code} value={year.code}>{year.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="division">Division</Label>
          <Select id="division" {...form.register("division")}>
            <option value="">Select</option>
            {options.divisions.map((division) => <option key={division.name}>{division.name}</option>)}
          </Select>
        </div>
        <div><Label htmlFor="rollNumber">Roll number</Label><Input id="rollNumber" {...form.register("rollNumber")} /></div>
        <div><Label htmlFor="studentId">Student ID</Label><Input id="studentId" {...form.register("studentId")} /></div>
      </div>
      <div><Label htmlFor="skills">Skills</Label><Input id="skills" placeholder="TypeScript, robotics" {...form.register("skills")} /></div>
      <div><Label htmlFor="interests">Interests</Label><Input id="interests" placeholder="Hackathons, design" {...form.register("interests")} /></div>
      <div><Label htmlFor="bio">Bio</Label><Textarea id="bio" {...form.register("bio")} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label htmlFor="linkedin">LinkedIn</Label><Input id="linkedin" placeholder="https://" {...form.register("linkedin")} /></div>
        <div><Label htmlFor="github">GitHub</Label><Input id="github" placeholder="https://" {...form.register("github")} /></div>
        <div><Label htmlFor="portfolio">Portfolio</Label><Input id="portfolio" placeholder="https://" {...form.register("portfolio")} /></div>
        <div><Label htmlFor="photo">Profile photo</Label><Input id="photo" name="photo" type="file" accept="image/*" /></div>
        <div>
          <Label htmlFor="resume">Resume PDF</Label>
          <Input id="resume" name="resume" type="file" accept="application/pdf" />
          {resumeUrl ? <a className="mt-1 inline-block text-sm font-medium" href={resumeUrl}>Current resume</a> : null}
        </div>
      </div>
      <Button disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}
