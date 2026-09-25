import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function prefixFromName(name: string) {
  const words = name.split(/\s+/).filter((word) => /[a-z]/i.test(word));
  const word = (words[0] ?? "event").replace(/[^a-z]/gi, "");
  return word.slice(0, 4).toUpperCase().padEnd(2, "X");
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function parsePassToken(raw: string) {
  const text = raw.trim();
  const fromPath = text.match(/\/passes\/([A-Za-z0-9_-]+)/);
  if (fromPath) return fromPath[1];
  const prefixed = text.match(/^nmiet:pass:(.+)$/);
  if (prefixed) return prefixed[1];
  if (/^[A-Za-z0-9_-]{20,}$/.test(text)) return text;
  return null;
}

export function safeCallback(value: string | undefined | null, fallback = "/home") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export { isProfileComplete } from "@/lib/profile-completion";

export function registrationOpen(event: { status: string; registrationDeadline: Date | string }) {
  return event.status === "PUBLISHED" && new Date(event.registrationDeadline).getTime() > Date.now();
}

export function youtubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.endsWith("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.endsWith("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}
