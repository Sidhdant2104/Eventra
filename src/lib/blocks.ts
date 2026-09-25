export const BLOCK_TYPES = [
  "HERO",
  "ABOUT",
  "RICH_TEXT",
  "IMAGE",
  "GALLERY",
  "VIDEO",
  "SPEAKERS",
  "TIMELINE",
  "PRIZES",
  "RULES",
  "FAQS",
  "SPONSORS",
  "ORGANIZERS",
  "CONTACT",
  "REGISTRATION_CTA",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_LABELS: Record<BlockType, string> = {
  HERO: "Hero",
  ABOUT: "About",
  RICH_TEXT: "Rich text",
  IMAGE: "Image",
  GALLERY: "Image gallery",
  VIDEO: "Video",
  SPEAKERS: "Speakers",
  TIMELINE: "Timeline",
  PRIZES: "Prizes",
  RULES: "Rules",
  FAQS: "FAQs",
  SPONSORS: "Sponsors",
  ORGANIZERS: "Team / organizers",
  CONTACT: "Contact",
  REGISTRATION_CTA: "Registration CTA",
};

export type EditorSection = {
  id: string;
  type: BlockType;
  visible: boolean;
  content: Record<string, unknown>;
};

function str(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function list(value: unknown, map: (item: Record<string, unknown>) => Record<string, string>, limit = 24) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, limit).map((item) => map(item && typeof item === "object" ? (item as Record<string, unknown>) : {}));
}

export function defaultContent(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "HERO":
      return { eyebrow: "", title: "", subtitle: "", image: "", accent: "", mood: "" };
    case "ABOUT":
      return { heading: "About the event", body: "", image: "" };
    case "RICH_TEXT":
      return { heading: "Why participate", body: "" };
    case "IMAGE":
      return { url: "", alt: "", caption: "" };
    case "GALLERY":
      return { heading: "Gallery", images: [{ url: "", alt: "" }] };
    case "VIDEO":
      return { heading: "Watch", url: "", caption: "" };
    case "SPEAKERS":
      return { heading: "Speakers", people: [{ name: "", role: "", bio: "", image: "" }] };
    case "TIMELINE":
      return { heading: "Timeline", items: [{ time: "", title: "", description: "" }] };
    case "PRIZES":
      return { heading: "Prizes", prizes: [{ place: "1st", title: "", reward: "", description: "" }] };
    case "RULES":
      return { heading: "Rules", rules: [""] };
    case "FAQS":
      return { heading: "FAQs", items: [{ question: "", answer: "" }] };
    case "SPONSORS":
      return { heading: "Sponsors", sponsors: [{ name: "", logo: "", tier: "Partner" }] };
    case "ORGANIZERS":
      return { heading: "Organizers", people: [{ name: "", role: "", image: "" }] };
    case "CONTACT":
      return { heading: "Contact", email: "", phone: "", location: "", note: "" };
    case "REGISTRATION_CTA":
      return { heading: "Ready to register?", body: "Use your NMIET profile. No repeated forms.", buttonLabel: "Register now" };
  }
}

export function sanitizeSection(type: string, content: unknown) {
  if (!BLOCK_TYPES.includes(type as BlockType)) throw new Error("Unknown block type.");
  const source = content && typeof content === "object" ? (content as Record<string, unknown>) : {};
  switch (type as BlockType) {
    case "HERO":
      return {
        eyebrow: str(source.eyebrow, 140),
        title: str(source.title, 180),
        subtitle: str(source.subtitle, 500),
        image: str(source.image, 500),
        accent: /^#[0-9a-fA-F]{6}$/.test(str(source.accent, 7)) ? str(source.accent, 7) : "",
        mood: source.mood === "light" || source.mood === "dark" ? source.mood : "",
      };
    case "ABOUT":
      return { heading: str(source.heading, 160), body: str(source.body, 4000), image: str(source.image, 500) };
    case "RICH_TEXT":
      return { heading: str(source.heading, 160), body: str(source.body, 6000) };
    case "IMAGE":
      return { url: str(source.url, 500), alt: str(source.alt, 180), caption: str(source.caption, 240) };
    case "GALLERY":
      return {
        heading: str(source.heading, 160),
        images: list(source.images, (item) => ({ url: str(item.url, 500), alt: str(item.alt, 180) })),
      };
    case "VIDEO":
      return { heading: str(source.heading, 160), url: str(source.url, 500), caption: str(source.caption, 240) };
    case "SPEAKERS":
      return {
        heading: str(source.heading, 160),
        people: list(source.people, (item) => ({
          name: str(item.name, 120),
          role: str(item.role, 120),
          bio: str(item.bio, 400),
          image: str(item.image, 500),
        })),
      };
    case "TIMELINE":
      return {
        heading: str(source.heading, 160),
        items: list(source.items, (item) => ({
          time: str(item.time, 80),
          title: str(item.title, 160),
          description: str(item.description, 400),
        })),
      };
    case "PRIZES":
      return {
        heading: str(source.heading, 160),
        prizes: list(source.prizes, (item) => ({
          place: str(item.place, 40),
          title: str(item.title, 120),
          reward: str(item.reward, 80),
          description: str(item.description, 240),
        })),
      };
    case "RULES":
      return {
        heading: str(source.heading, 160),
        rules: (Array.isArray(source.rules) ? source.rules : []).slice(0, 40).map((rule) => str(rule, 400)).filter(Boolean),
      };
    case "FAQS":
      return {
        heading: str(source.heading, 160),
        items: list(source.items, (item) => ({ question: str(item.question, 240), answer: str(item.answer, 800) })),
      };
    case "SPONSORS":
      return {
        heading: str(source.heading, 160),
        sponsors: list(source.sponsors, (item) => ({
          name: str(item.name, 120),
          logo: str(item.logo, 500),
          tier: str(item.tier, 40),
        })),
      };
    case "ORGANIZERS":
      return {
        heading: str(source.heading, 160),
        people: list(source.people, (item) => ({
          name: str(item.name, 120),
          role: str(item.role, 120),
          image: str(item.image, 500),
        })),
      };
    case "CONTACT":
      return {
        heading: str(source.heading, 160),
        email: str(source.email, 160),
        phone: str(source.phone, 40),
        location: str(source.location, 200),
        note: str(source.note, 400),
      };
    case "REGISTRATION_CTA":
      return { heading: str(source.heading, 160), body: str(source.body, 400), buttonLabel: str(source.buttonLabel, 40) || "Register now" };
  }
}

export function starterSections(): EditorSection[] {
  return (["HERO", "ABOUT", "RICH_TEXT", "PRIZES", "TIMELINE", "FAQS", "REGISTRATION_CTA"] as BlockType[]).map((type, index) => ({
    id: `new-${type.toLowerCase()}-${index}`,
    type,
    visible: true,
    content: defaultContent(type),
  }));
}
