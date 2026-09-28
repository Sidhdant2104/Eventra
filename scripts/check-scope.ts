import { prisma } from "../src/lib/db";
import { hasPermission } from "../src/lib/authorize";

async function main() {
  const events = await prisma.event.findMany({ select: { id: true, name: true, clubId: true } });
  const admins = await prisma.clubMember.findMany({
    where: { role: "CLUB_ADMIN" },
    include: { user: { select: { id: true, role: true, email: true } }, club: { select: { id: true, name: true } } },
  });
  let failures = 0;
  for (const admin of admins) {
    if (admin.user.role === "SUPER_ADMIN") continue;
    for (const event of events) {
      const allowed = await hasPermission(admin.user, "REGISTRATIONS_VIEW", { type: "EVENT", id: event.id, clubId: event.clubId });
      const expected = event.clubId === admin.clubId;
      if (allowed !== expected) {
        failures += 1;
        console.log("FAIL", admin.user.email, event.name, "allowed", allowed, "expected", expected);
      }
    }
    const foreign = await hasPermission(admin.user, "REGISTRATIONS_VIEW", { type: "EVENT", id: "event-foreign", clubId: "club-foreign" });
    const foreignMembers = await hasPermission(admin.user, "CLUB_MANAGE_MEMBERS", { type: "CLUB", id: "club-foreign" });
    if (foreign || foreignMembers) {
      failures += 1;
      console.log("FAIL foreign", admin.user.email);
    } else {
      console.log("OK", admin.user.email, admin.club.name);
    }
  }
  const staff = await prisma.eventStaff.findMany({ include: { user: { select: { id: true, role: true, email: true } } } });
  for (const row of staff) {
    if (row.user.role === "SUPER_ADMIN") continue;
    const assigned = new Set(staff.filter((item) => item.userId === row.userId).map((item) => item.eventId));
    const ownEvent = events.find((event) => event.id === row.eventId);
    const other = events.find((event) => !assigned.has(event.id));
    if (!ownEvent) continue;
    const own = await hasPermission(row.user, "REGISTRATIONS_VIEW", { type: "EVENT", id: ownEvent.id, clubId: ownEvent.clubId });
    const delegate = await hasPermission(row.user, "DELEGATE", { type: "EVENT", id: ownEvent.id, clubId: ownEvent.clubId });
    const otherAllowed = other
      ? await hasPermission(row.user, "REGISTRATIONS_VIEW", { type: "EVENT", id: other.id, clubId: other.clubId })
      : false;
    if (row.role === "VOLUNTEER" && (own || otherAllowed)) {
      failures += 1;
      console.log("FAIL volunteer", row.user.email, { own, otherAllowed });
    }
    if (row.role === "EVENT_MANAGER" && (!own || delegate || (other && other.clubId !== ownEvent.clubId && otherAllowed))) {
      failures += 1;
      console.log("FAIL manager", row.user.email, { own, delegate, otherAllowed });
    }
    if (row.role === "EVENT_MANAGER" && own && !delegate) console.log("OK manager", row.user.email);
  }
  console.log(failures === 0 ? "IDOR checks passed" : "IDOR checks failed", { admins: admins.length, events: events.length, staff: staff.length });
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main();
