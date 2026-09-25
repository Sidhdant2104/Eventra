import { z } from "zod";

const optionalLink = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Links must start with http:// or https://");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  preferredName: z.string().trim().max(40),
  college: z.string().trim().min(2, "Select your college").max(120),
  department: z.string().trim().min(2, "Select your department"),
  year: z.string().trim().min(1, "Select your year"),
  division: z.string().trim().min(1, "Select your division"),
  rollNumber: z.string().trim().min(3, "Enter your roll number").max(32),
  studentId: z.string().trim().max(32),
  skills: z.string().trim().max(300),
  interests: z.string().trim().max(300),
  bio: z.string().trim().max(600),
  linkedin: optionalLink,
  github: optionalLink,
  portfolio: optionalLink,
});

export const onboardingBasicSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  preferredName: z.string().trim().max(40),
});

export const onboardingAboutSchema = z.object({
  skills: z.string().trim().max(300),
  interests: z.string().trim().max(300),
  bio: z.string().trim().max(600),
});

export const onboardingLinksSchema = z.object({
  linkedin: optionalLink,
  github: optionalLink,
  portfolio: optionalLink,
});

export const eventSettingsSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
    summary: z.string().trim().min(10).max(240),
    description: z.string().trim().max(2000),
    coverImage: z.string().trim().max(500),
    startAt: z.string().min(1, "Choose a start time"),
    endAt: z.string().min(1, "Choose an end time"),
    registrationDeadline: z.string().min(1, "Choose a registration deadline"),
    venue: z.string().trim().max(160),
    mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
    category: z.string().trim().min(2).max(40),
    maxParticipants: z.string().trim(),
    registrationMode: z.enum(["SOLO", "TEAM", "BOTH"]),
    minTeamSize: z.number().int().min(1).max(20),
    maxTeamSize: z.number().int().min(1).max(20),
    allowDuplicate: z.boolean(),
    featured: z.boolean(),
    registrationPrefix: z.string().trim().regex(/^[A-Z0-9]{2,6}$/, "Use 2–6 letters or numbers"),
    clubId: z.string().min(1),
  })
  .refine((value) => value.minTeamSize <= value.maxTeamSize, {
    path: ["maxTeamSize"],
    message: "Maximum team size must be at least the minimum",
  });

export const clubSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  description: z.string().trim().max(800),
});

export const fieldSchema = z.object({
  label: z.string().trim().min(2).max(80),
  key: z.string().trim().regex(/^[a-z][a-z0-9_]{1,40}$/, "Use a short lowercase key"),
  type: z.enum(["TEXT", "TEXTAREA", "SELECT", "URL", "NUMBER"]),
  required: z.boolean(),
  options: z.string().trim().max(500),
  appliesTo: z.enum(["SOLO", "TEAM", "BOTH"]),
});

export function issueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
