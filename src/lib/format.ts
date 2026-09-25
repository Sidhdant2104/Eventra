const TIME_ZONE = "Asia/Kolkata";

export function formatWhen(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDay(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTimeLocal(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function parseCollegeDateTime(value: string) {
  if (!value) return null;
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}+05:30`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function yearLabel(year: string | null | undefined) {
  switch (year) {
    case "FE":
      return "First Year";
    case "SE":
      return "Second Year";
    case "TE":
      return "Third Year";
    case "BE":
      return "Final Year";
    default:
      return year || "—";
  }
}
