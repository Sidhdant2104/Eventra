"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { updateProfile } from "@/lib/actions/profile";
import { DEPARTMENTS, DIVISIONS, YEARS } from "@/lib/constants";
import { profileSchema } from "@/lib/validators";

type Values = z.infer<typeof profileSchema>;

export function ProfileForm({ initial, resumeUrl }: { initial: Values; resumeUrl?: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(profileSchema), defaultValues: initial });

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (values, event) => {
      setError(null);
      setMessage(null);
      const files = new FormData();
      const submitted = new FormData(event?.currentTarget);
      const photo = submitted.get("photo");
      const resume = submitted.get("resume");
      if (photo instanceof File && photo.size > 0) files.set("photo", photo);
      if (resume instanceof File && resume.size > 0) files.set("resume", resume);
      const result = await updateProfile(values, files);
      if (!result.ok) setError(result.error);
      else {
        setMessage("Profile saved. Event registration will use these details.");
        router.refresh();
      }
    })}>
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="good">{message}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label htmlFor="name">Full name</Label><Input id="name" {...form.register("name")} /></div>
        <div><Label htmlFor="phone">Phone</Label><Input id="phone" {...form.register("phone")} /></div>
        <div><Label htmlFor="college">College</Label><Input id="college" {...form.register("college")} /></div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Select id="department" {...form.register("department")}>
            <option value="">Select</option>
            {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <Select id="year" {...form.register("year")}>
            <option value="">Select</option>
            {YEARS.map((year) => <option key={year.value} value={year.value}>{year.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="division">Division</Label>
          <Select id="division" {...form.register("division")}>
            <option value="">Select</option>
            {DIVISIONS.map((division) => <option key={division}>{division}</option>)}
          </Select>
        </div>
        <div><Label htmlFor="rollNumber">Roll number</Label><Input id="rollNumber" {...form.register("rollNumber")} /></div>
        <div><Label htmlFor="skills">Skills and interests</Label><Input id="skills" placeholder="React, robotics, design" {...form.register("skills")} /></div>
      </div>
      <div><Label htmlFor="bio">Bio</Label><Textarea id="bio" {...form.register("bio")} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label htmlFor="linkedin">LinkedIn</Label><Input id="linkedin" placeholder="https://" {...form.register("linkedin")} /></div>
        <div><Label htmlFor="github">GitHub</Label><Input id="github" placeholder="https://" {...form.register("github")} /></div>
        <div><Label htmlFor="photo">Profile photo</Label><Input id="photo" name="photo" type="file" accept="image/*" /></div>
        <div>
          <Label htmlFor="resume">Resume PDF</Label>
          <Input id="resume" name="resume" type="file" accept="application/pdf" />
          {resumeUrl ? <a className="mt-1 inline-block text-sm text-brand" href={resumeUrl}>Current resume</a> : null}
        </div>
      </div>
      {Object.values(form.formState.errors)[0]?.message ? <Alert>{Object.values(form.formState.errors)[0]?.message}</Alert> : null}
      <Button disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}
