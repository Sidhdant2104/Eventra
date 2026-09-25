import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getEventAccess } from "@/lib/permissions";
import { yearLabel } from "@/lib/format";

function cell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await getEventAccess(user, eventId);
  if (!access || access.level === "scan") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const registrations = await prisma.registration.findMany({
    where: { eventId },
    include: {
      user: { include: { profile: true } },
      team: true,
      participants: { include: { user: { include: { profile: true } } } },
      responses: { include: { field: true } },
      attendance: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const extraKeys = [...new Set(registrations.flatMap((registration) => registration.responses.map((response) => response.field.label)))];
  const header = ["Name", "Registration ID", "Email", "Phone", "Department", "Year", "Division", "Roll number", "Team", "Status", "Registered at", "Checked in", ...extraKeys];
  const lines = [header.map(cell).join(",")];
  for (const registration of registrations) {
    const people = registration.participants.length > 0 ? registration.participants.map((participant) => participant.user) : registration.user ? [registration.user] : [];
    for (const person of people) {
      const checked = registration.attendance.find((row) => row.userId === person.id);
      const row = [
        person.name,
        registration.code,
        person.email,
        person.profile?.phone,
        person.profile?.department,
        yearLabel(person.profile?.year),
        person.profile?.division,
        person.profile?.rollNumber,
        registration.team?.name,
        registration.status,
        registration.createdAt.toISOString(),
        checked ? checked.checkedInAt.toISOString() : "",
        ...extraKeys.map((key) => registration.responses.find((response) => response.field.label === key)?.value ?? ""),
      ];
      lines.push(row.map(cell).join(","));
    }
  }
  return new NextResponse(`\uFEFF${lines.join("\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${access.event.slug}-registrations.csv"`,
    },
  });
}
