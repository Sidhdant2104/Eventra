import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const actor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { status: true, role: true } });
  if (!actor || actor.status === "SUSPENDED") return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { userId } = await context.params;
  if (userId !== session.user.id && actor.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "You can only open your own profile." }, { status: 403 });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      profile: { select: { college: true, department: true, year: true, division: true, bio: true, profileCompleted: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  return NextResponse.json(user);
}
