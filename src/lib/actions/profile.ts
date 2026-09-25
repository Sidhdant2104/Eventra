"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { saveUpload } from "@/lib/storage";
import { issueMessage, profileSchema } from "@/lib/validators";

export async function updateProfile(input: unknown, formData?: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: issueMessage(parsed.error) };
  const rollOwner = await prisma.studentProfile.findUnique({ where: { rollNumber: parsed.data.rollNumber } });
  if (rollOwner && rollOwner.userId !== user.id) {
    return { ok: false as const, error: "That roll number is already linked to another student." };
  }

  let image = user.image;
  let resumeUrl = user.profile?.resumeUrl ?? null;
  const photo = formData?.get("photo");
  const resume = formData?.get("resume");
  try {
    if (photo instanceof File && photo.size > 0) image = await saveUpload(photo, "avatars");
    if (resume instanceof File && resume.size > 0) resumeUrl = await saveUpload(resume, "resumes");
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Upload failed." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      image,
      profile: {
        upsert: {
          update: {
            phone: parsed.data.phone,
            college: parsed.data.college,
            department: parsed.data.department,
            year: parsed.data.year,
            division: parsed.data.division,
            rollNumber: parsed.data.rollNumber,
            skills: parsed.data.skills || null,
            bio: parsed.data.bio || null,
            linkedin: parsed.data.linkedin || null,
            github: parsed.data.github || null,
            resumeUrl,
          },
          create: {
            phone: parsed.data.phone,
            college: parsed.data.college,
            department: parsed.data.department,
            year: parsed.data.year,
            division: parsed.data.division,
            rollNumber: parsed.data.rollNumber,
            skills: parsed.data.skills || null,
            bio: parsed.data.bio || null,
            linkedin: parsed.data.linkedin || null,
            github: parsed.data.github || null,
            resumeUrl,
          },
        },
      },
    },
  });
  revalidatePath("/profile");
  revalidatePath("/home");
  return { ok: true as const };
}
