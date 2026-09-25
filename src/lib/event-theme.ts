export type EventTheme = {
  bg: string;
  fg: string;
  accent: string;
  mood: "dark" | "light";
  pattern: "grid" | "bars" | "arcs" | "editorial";
};

const THEMES: Record<string, EventTheme> = {
  Hackathon: { bg: "#10151c", fg: "#e7eef6", accent: "#5ee0c5", mood: "dark", pattern: "grid" },
  Technical: { bg: "#16120e", fg: "#f6f1ea", accent: "#ff8a3d", mood: "dark", pattern: "bars" },
  Workshop: { bg: "#f3ecdf", fg: "#1c1915", accent: "#b4532a", mood: "light", pattern: "editorial" },
  Seminar: { bg: "#12151c", fg: "#f3f5f8", accent: "#8eb4ff", mood: "dark", pattern: "arcs" },
  Cultural: { bg: "#2a1220", fg: "#fff3ea", accent: "#ffb45a", mood: "dark", pattern: "arcs" },
  Sports: { bg: "#102018", fg: "#f3fff6", accent: "#8dff62", mood: "dark", pattern: "bars" },
  Entrepreneurship: { bg: "#171717", fg: "#f7f4ee", accent: "#e6c27a", mood: "dark", pattern: "editorial" },
};

const FALLBACK: EventTheme = { bg: "#121316", fg: "#f4f2ec", accent: "#ff3d1f", mood: "dark", pattern: "grid" };

export function eventTheme(category: string) {
  return THEMES[category] ?? FALLBACK;
}

export function resolveEventTheme(category: string, accent?: string, mood?: string): EventTheme {
  const base = { ...eventTheme(category) };
  if (accent && /^#[0-9a-fA-F]{6}$/.test(accent)) base.accent = accent;
  if (mood === "light") {
    base.mood = "light";
    base.bg = "#f6f1e8";
    base.fg = "#161616";
  } else if (mood === "dark") {
    base.mood = "dark";
    base.bg = "#101114";
    base.fg = "#f6f4ef";
  }
  return base;
}

export function isPlaceholderCover(src?: string | null) {
  if (!src) return true;
  return src.startsWith("/covers/");
}

export function artworkSeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 33 + value.charCodeAt(index)) % 997;
  return hash;
}
