export const DEPARTMENTS = [
  "Computer Engineering",
  "Information Technology",
  "Artificial Intelligence & Data Science",
  "Electronics & Telecommunication",
  "Mechanical Engineering",
  "Civil Engineering",
  "First Year Engineering",
] as const;

export const YEARS = [
  { value: "FE", label: "First Year" },
  { value: "SE", label: "Second Year" },
  { value: "TE", label: "Third Year" },
  { value: "BE", label: "Final Year" },
] as const;

export const DIVISIONS = ["A", "B", "C", "D"] as const;

export const EVENT_CATEGORIES = [
  "Technical",
  "Hackathon",
  "Workshop",
  "Seminar",
  "Cultural",
  "Sports",
  "Entrepreneurship",
] as const;

export { DEMO_PASSWORD } from "@/lib/demo-password";

export const DEMO_ACCOUNTS = [
  { role: "Student", email: "aarav@nmiet.edu.in", note: "Register, teams, passes" },
  { role: "Student", email: "meera@nmiet.edu.in", note: "Pending team invite" },
  { role: "Club admin", email: "coding.admin@nmiet.edu.in", note: "Coding Club" },
  { role: "Event manager", email: "manager@nmiet.edu.in", note: "Assigned events" },
  { role: "Volunteer", email: "volunteer@nmiet.edu.in", note: "QR scanner" },
  { role: "Super admin", email: "admin@nmiet.edu.in", note: "Full platform" },
] as const;
