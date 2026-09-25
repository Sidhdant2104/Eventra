import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/permissions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "STUDENT" || user.role === "VOLUNTEER") {
    return NextResponse.json({ clubs: [] }, { status: 401 });
  }
  const clubs = await prisma.club.findMany({
    where: user.role === "SUPER_ADMIN" ? {} : { members: { some: { userId: user.id, role: "CLUB_ADMIN" } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ clubs });
}
