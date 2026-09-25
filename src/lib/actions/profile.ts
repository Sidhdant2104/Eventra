"use server";

import { revalidatePath } from "next/cache";
import { isProfileComplete } from "@/lib/profile-completion";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { saveUpload } from "@/lib/storage";
import { issueMessage, onboardingAboutSchema, onboardingBasicSchema, onboardingLinksSchema, profileSchema } from "@/lib/validators";

async function academicError(input: { college: string; department: string; year: string; division: string }) {
  const college = await prisma.college.findFirst({
    where: { name: input.college, active: true },
    include: { departments: { where: { active: true } } },
  });
  if (!college) return "Select a college.";
  if (!college.departments.some((department) => department.name === input.department)) return "Select a department for that college.";
  const year = await prisma.academicYear.findFirst({ where: { code: input.year, active: true } });
  if (!year) return "Select your year.";
  const division = await prisma.divisionOption.findFirst({ where: { name: input.division, active: true } });
  if (!division) return "Select your division.";
  return null;
}

async function markCompletion(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
  if (!user) return;
  const complete = isProfileComplete(user);
  if (user.profile && user.profile.profileCompleted !== complete) {
    await prisma.studentProfile.update({ where: { userId }, data: { profileCompleted: complete } });
  }
}

export async function updateProfile(input: unknown, formData?: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: issueMessage(parsed.error) };
  const academic = await academicError(parsed.data);
  if (academic) return { ok: false as const, error: academic };
  const rollOwner = await prisma.studentProfile.findUnique({ where: { rollNumber: parsed.data.rollNumber } });
  if (rollOwner && rollOwner.userId !== user.id) return { ok: false as const, error: "That roll number is already linked to another student." };
  if (parsed.data.studentId) {
    const studentOwner = await prisma.studentProfile.findUnique({ where: { studentId: parsed.data.studentId } });
    if (studentOwner && studentOwner.userId !== user.id) return { ok: false as const, error: "That student ID is already linked to another student." };
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

  const data = parsed.data;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      image,
      profile: {
        upsert: {
          update: {
            preferredName: data.preferredName || null,
            college: data.college,
            department: data.department,
            year: data.year,
            division: data.division,
            rollNumber: data.rollNumber,
            studentId: data.studentId || null,
            skills: data.skills || null,
            interests: data.interests || null,
            bio: data.bio || null,
            linkedin: data.linkedin || null,
            github: data.github || null,
            portfolioUrl: data.portfolio || null,
            resumeUrl,
          },
          create: {
            preferredName: data.preferredName || null,
            college: data.college,
            department: data.department,
            year: data.year,
            division: data.division,
            rollNumber: data.rollNumber,
            studentId: data.studentId || null,
            skills: data.skills || null,
            interests: data.interests || null,
            bio: data.bio || null,
            linkedin: data.linkedin || null,
            github: data.github || null,
            portfolioUrl: data.portfolio || null,
            resumeUrl,
            phone: user.profile?.phone,
          },
        },
      },
    },
  });
  await markCompletion(user.id);
  revalidatePath("/profile");
  revalidatePath("/home");
  return { ok: true as const };
}

export async function saveOnboardingBasic(input: unknown, formData?: FormData) {
  const user = await requireUser();
  const parsed = onboardingBasicSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: issueMessage(parsed.error) };
  let image = user.image;
  const photo = formData?.get("photo");
  try {
    if (photo instanceof File && photo.size > 0) image = await saveUpload(photo, "avatars");
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Upload failed." };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      image,
      profile: { upsert: { update: { preferredName: parsed.data.preferredName || null }, create: { college: "NMIET", preferredName: parsed.data.preferredName || null } } },
    },
  });
  await markCompletion(user.id);
  return { ok: true as const };
}

export async function saveOnboardingAcademic(input: unknown) {
  const user = await requireUser();
  const parsed = profileSchema.pick({ college: true, department: true, year: true, division: true, rollNumber: true, studentId: true }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: issueMessage(parsed.error) };
  const academic = await academicError(parsed.data);
  if (academic) return { ok: false as const, error: academic };
  const rollOwner = await prisma.studentProfile.findUnique({ where: { rollNumber: parsed.data.rollNumber } });
  if (rollOwner && rollOwner.userId !== user.id) return { ok: false as const, error: "That roll number is already linked to another student." };
  if (parsed.data.studentId) {
    const studentOwner = await prisma.studentProfile.findUnique({ where: { studentId: parsed.data.studentId } });
    if (studentOwner && studentOwner.userId !== user.id) return { ok: false as const, error: "That student ID is already linked to another student." };
  }
  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: parsed.data.studentId ? parsed.data : { ...parsed.data, studentId: null },
    create: { userId: user.id, ...parsed.data, studentId: parsed.data.studentId || null },
  });
  await markCompletion(user.id);
  return { ok: true as const };
}

export async function saveOnboardingAbout(input: unknown) {
  const user = await requireUser();
  const parsed = onboardingAboutSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: issueMessage(parsed.error) };
  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: { skills: parsed.data.skills || null, interests: parsed.data.interests || null, bio: parsed.data.bio || null },
    create: { userId: user.id, college: "NMIET", skills: parsed.data.skills || null, interests: parsed.data.interests || null, bio: parsed.data.bio || null },
  });
  return { ok: true as const };
}

export async function saveOnboardingLinks(input: unknown) {
  const user = await requireUser();
  const parsed = onboardingLinksSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: issueMessage(parsed.error) };
  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: { linkedin: parsed.data.linkedin || null, github: parsed.data.github || null, portfolioUrl: parsed.data.portfolio || null },
    create: { userId: user.id, college: "NMIET", linkedin: parsed.data.linkedin || null, github: parsed.data.github || null, portfolioUrl: parsed.data.portfolio || null },
  });
  await markCompletion(user.id);
  revalidatePath("/profile");
  revalidatePath("/home");
  return { ok: true as const };
}
