export const PERMISSIONS = {
  CLUB_VIEW: { label: "View the club", group: "Club" },
  CLUB_EDIT: { label: "Edit the club profile", group: "Club" },
  CLUB_ARCHIVE: { label: "Archive the club", group: "Club" },
  CLUB_MANAGE_MEMBERS: { label: "Add and remove club members", group: "Club" },
  CLUB_MANAGE_TEAMS: { label: "Create and archive club teams", group: "Club" },
  CLUB_ASSIGN_ROLES: { label: "Assign club roles", group: "Club" },
  EVENT_VIEW: { label: "Open the event workspace", group: "Event" },
  EVENT_CREATE: { label: "Create events", group: "Event" },
  EVENT_EDIT: { label: "Edit event details", group: "Event" },
  EVENT_PUBLISH: { label: "Publish the event", group: "Event" },
  EVENT_ARCHIVE: { label: "Archive the event", group: "Event" },
  EVENT_MANAGE_SETTINGS: { label: "Change event settings", group: "Event" },
  EVENT_PAGE_EDIT: { label: "Edit the public event page", group: "Event page" },
  REGISTRATIONS_VIEW: { label: "View registrations", group: "Registrations" },
  REGISTRATIONS_EXPORT: { label: "Export registrations", group: "Registrations" },
  REGISTRATIONS_MANAGE: { label: "Change registrations", group: "Registrations" },
  TEAM_VIEW: { label: "View participant teams", group: "Teams" },
  TEAM_MANAGE: { label: "Manage participant teams", group: "Teams" },
  ATTENDANCE_VIEW: { label: "View attendance", group: "Attendance" },
  ATTENDANCE_SCAN: { label: "Scan passes", group: "Attendance" },
  ATTENDANCE_MANAGE: { label: "Correct attendance", group: "Attendance" },
  ANNOUNCEMENT_SEND: { label: "Send announcements", group: "Announcements" },
  CERTIFICATE_ISSUE: { label: "Issue certificates", group: "Certificates" },
  CERTIFICATE_REVOKE: { label: "Revoke certificates", group: "Certificates" },
  ANALYTICS_VIEW: { label: "View event numbers", group: "Insights" },
  DELEGATE: { label: "Assign these permissions to other people", group: "Delegation" },
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const CLUB_ADMIN_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export const EVENT_MANAGER_PERMISSIONS: Permission[] = [
  "EVENT_VIEW",
  "EVENT_EDIT",
  "EVENT_PUBLISH",
  "EVENT_MANAGE_SETTINGS",
  "EVENT_PAGE_EDIT",
  "REGISTRATIONS_VIEW",
  "REGISTRATIONS_EXPORT",
  "REGISTRATIONS_MANAGE",
  "TEAM_VIEW",
  "TEAM_MANAGE",
  "ATTENDANCE_VIEW",
  "ATTENDANCE_SCAN",
  "ATTENDANCE_MANAGE",
  "ANNOUNCEMENT_SEND",
  "CERTIFICATE_ISSUE",
  "CERTIFICATE_REVOKE",
  "ANALYTICS_VIEW",
];

export const SCANNER_PERMISSIONS: Permission[] = ["EVENT_VIEW", "ATTENDANCE_VIEW", "ATTENDANCE_SCAN"];

export const TEAM_PRESETS: { id: string; label: string; permissions: Permission[] }[] = [
  { id: "none", label: "No extra access yet", permissions: ["EVENT_VIEW"] },
  { id: "registration", label: "Registration", permissions: ["EVENT_VIEW", "REGISTRATIONS_VIEW", "REGISTRATIONS_MANAGE", "REGISTRATIONS_EXPORT", "TEAM_VIEW"] },
  { id: "design", label: "Design", permissions: ["EVENT_VIEW", "EVENT_PAGE_EDIT"] },
  { id: "technical", label: "Technical", permissions: ["EVENT_VIEW"] },
  { id: "marketing", label: "Marketing", permissions: ["EVENT_VIEW", "ANNOUNCEMENT_SEND"] },
  { id: "scanner", label: "Check-in", permissions: ["EVENT_VIEW", "ATTENDANCE_VIEW", "ATTENDANCE_SCAN"] },
];

export type ScopeType = "SYSTEM" | "CLUB" | "EVENT" | "TEAM";

export type AccessScope =
  | { type: "SYSTEM" }
  | { type: "CLUB"; id: string }
  | { type: "EVENT"; id: string; clubId: string }
  | { type: "TEAM"; id: string; clubId?: string | null; eventId?: string | null };

export type HeldGrant = {
  permission: Permission;
  scopeType: ScopeType;
  scopeId: string;
};

export function isPermission(value: string): value is Permission {
  return value in PERMISSIONS;
}

export function permissionCovers(held: HeldGrant, permission: Permission, target: AccessScope) {
  if (held.permission !== permission) return false;
  if (held.scopeType === "SYSTEM") return true;
  if (target.type === "SYSTEM") return false;
  if (held.scopeType === "CLUB") {
    if (target.type === "CLUB") return held.scopeId === target.id;
    if (target.type === "EVENT") return held.scopeId === target.clubId;
    if (target.type === "TEAM") return Boolean(target.clubId && held.scopeId === target.clubId);
  }
  if (held.scopeType === "EVENT") {
    if (target.type === "EVENT") return held.scopeId === target.id;
    if (target.type === "TEAM") return Boolean(target.eventId && held.scopeId === target.eventId);
  }
  return held.scopeType === "TEAM" && target.type === "TEAM" && held.scopeId === target.id;
}

export function allows(grants: HeldGrant[], permission: Permission, target: AccessScope) {
  return grants.some((grant) => permissionCovers(grant, permission, target));
}

export function canDelegate(input: {
  grants: HeldGrant[];
  actorId: string;
  subjectId: string;
  permission: Permission;
  target: AccessScope;
}) {
  if (input.actorId === input.subjectId) return { ok: false as const, reason: "You cannot change your own permissions." };
  if (!allows(input.grants, "DELEGATE", input.target)) return { ok: false as const, reason: "You cannot assign permissions here." };
  if (!allows(input.grants, input.permission, input.target)) return { ok: false as const, reason: "You can only delegate a permission you already have." };
  return { ok: true as const };
}
