"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { requireUser } from "@/lib/permissions";
import { activeStatuses, allocateCode, dedupeFor, ensurePass, validateFieldResponses } from "@/lib/registration";
import { appUrl, isProfileComplete, registrationOpen } from "@/lib/utils";
import { randomToken } from "@/lib/crypto";

async function eventBySlug(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: { fields: { orderBy: { position: "asc" } } },
  });
}

async function activeMembership(userId: string, eventId: string) {
  return prisma.teamMember.findFirst({
    where: { userId, team: { eventId, status: { not: "CANCELLED" } } },
    include: { team: true },
  });
}

export async function createTeam(slug: string, name: string) {
  const user = await requireUser();
  if (!isProfileComplete(user)) return { ok: false as const, error: "Complete your profile before creating a team.", code: "PROFILE" as const };
  const event = await eventBySlug(slug);
  if (!event || event.registrationMode === "SOLO") return { ok: false as const, error: "This event does not use teams." };
  if (!registrationOpen(event)) return { ok: false as const, error: "Registration is closed." };
  const teamName = name.trim();
  if (teamName.length < 2 || teamName.length > 40) return { ok: false as const, error: "Team name should be 2–40 characters." };
  const existing = await activeMembership(user.id, event.id);
  if (existing) return { ok: false as const, error: "You are already on a team for this event." };
  const registered = await prisma.registrationParticipant.findFirst({
    where: { userId: user.id, eventId: event.id, registration: { status: { in: activeStatuses() } } },
  });
  if (registered) return { ok: false as const, error: "You already have a registration for this event." };
  try {
    const team = await prisma.team.create({
      data: {
        eventId: event.id,
        name: teamName,
        captainId: user.id,
        inviteToken: randomToken(18),
        members: { create: { userId: user.id } },
      },
    });
    revalidatePath("/teams");
    return { ok: true as const, teamId: team.id };
  } catch {
    return { ok: false as const, error: "A team with that name already exists for this event." };
  }
}

export async function searchStudents(query: string) {
  const user = await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];
  return prisma.user.findMany({
    where: {
      id: { not: user.id },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, profile: { select: { department: true, year: true } } },
    take: 8,
  });
}

async function assertCaptain(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { event: true, members: { include: { user: true } }, invitations: true },
  });
  if (!team || team.captainId !== userId) return null;
  return team;
}

export async function inviteTeammate(teamId: string, emailInput: string) {
  const user = await requireUser();
  const team = await assertCaptain(teamId, user.id);
  if (!team) return { ok: false as const, error: "Only the captain can invite teammates." };
  if (team.status !== "FORMING") return { ok: false as const, error: "This team is already registered." };
  const email = emailInput.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false as const, error: "Enter a valid email." };
  const accepted = team.members.length;
  const pending = team.invitations.filter((invitation) => invitation.status === "PENDING").length;
  if (accepted + pending >= team.event.maxTeamSize) return { ok: false as const, error: "This team is already at the maximum size." };
  const invitee = await prisma.user.findUnique({ where: { email } });
  if (invitee) {
    const membership = await activeMembership(invitee.id, team.eventId);
    if (membership) return { ok: false as const, error: "That student is already on a team for this event." };
  }
  const token = randomToken(18);
  const invitation = await prisma.teamInvitation.create({
    data: {
      teamId,
      email,
      invitedById: user.id,
      inviteeId: invitee?.id,
      token,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  const link = `${appUrl()}/invite/${token}`;
  if (invitee) {
    await notifyUser({
      userId: invitee.id,
      type: "TEAM_INVITATION",
      title: `Join ${team.name}`,
      body: `${user.name} invited you to their team for ${team.event.name}.`,
      href: `/invite/${token}`,
      email: { to: email, subject: `Team invite · ${team.name}`, text: `${user.name} invited you to ${team.name} for ${team.event.name}.\n\n${link}` },
    });
  } else {
    const { sendEmail } = await import("@/lib/email");
    await sendEmail({
      to: email,
      subject: `Team invite · ${team.name}`,
      text: `${user.name} invited you to ${team.name} for ${team.event.name} on NMIET One.\n\nCreate an account with this email, then open:\n${link}`,
    });
  }
  revalidatePath(`/teams/${teamId}`);
  return { ok: true as const, invitationId: invitation.id };
}

export async function respondToInvitation(token: string, accept: boolean) {
  const user = await requireUser();
  if (!isProfileComplete(user)) return { ok: false as const, error: "Complete your profile before joining a team.", code: "PROFILE" as const };
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { team: { include: { event: true, members: true, captain: true } } },
  });
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "This invitation is no longer active." };
  }
  if (invitation.team.status !== "FORMING") {
    return { ok: false as const, error: "This team is already registered." };
  }
  if (invitation.inviteeId && invitation.inviteeId !== user.id && invitation.email !== user.email) {
    return { ok: false as const, error: "This invitation was sent to a different account." };
  }
  if (!accept) {
    await prisma.teamInvitation.update({ where: { id: invitation.id }, data: { status: "REJECTED", inviteeId: user.id } });
    revalidatePath("/teams");
    return { ok: true as const, teamId: invitation.teamId };
  }
  if (invitation.team.members.length >= invitation.team.event.maxTeamSize) {
    return { ok: false as const, error: "This team is full." };
  }
  const membership = await activeMembership(user.id, invitation.team.eventId);
  if (membership) return { ok: false as const, error: "You are already on a team for this event." };
  const registered = await prisma.registrationParticipant.findFirst({
    where: { userId: user.id, eventId: invitation.team.eventId, registration: { status: { in: activeStatuses() } } },
  });
  if (registered) return { ok: false as const, error: "You already have a registration for this event." };
  await prisma.$transaction([
    prisma.teamMember.create({ data: { teamId: invitation.teamId, userId: user.id } }),
    prisma.teamInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED", inviteeId: user.id } }),
  ]);
  await notifyUser({
    userId: invitation.team.captainId,
    type: "TEAM_MEMBER_JOINED",
    title: `${user.name} joined ${invitation.team.name}`,
    body: `Your team for ${invitation.team.event.name} has a new member.`,
    href: `/teams/${invitation.teamId}`,
  });
  revalidatePath(`/teams/${invitation.teamId}`);
  revalidatePath("/teams");
  return { ok: true as const, teamId: invitation.teamId };
}

export async function acceptInviteLink(token: string, accept: boolean) {
  const invitation = await prisma.teamInvitation.findUnique({ where: { token } });
  if (invitation) return respondToInvitation(token, accept);
  if (!accept) return { ok: true as const, teamId: "" };
  return joinWithLink(token);
}

export async function joinWithLink(inviteToken: string) {
  const user = await requireUser();
  const team = await prisma.team.findUnique({ where: { inviteToken }, include: { event: true } });
  if (!team) return { ok: false as const, error: "This invite link is not valid." };
  const token = randomToken(18);
  await prisma.teamInvitation.create({
    data: {
      teamId: team.id,
      email: user.email,
      invitedById: team.captainId,
      inviteeId: user.id,
      token,
      expiresAt: team.event.registrationDeadline,
    },
  });
  return respondToInvitation(token, true);
}

export async function leaveTeam(teamId: string) {
  const user = await requireUser();
  const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
  if (!team) return { ok: false as const, error: "Team not found." };
  if (team.status !== "FORMING") return { ok: false as const, error: "Registered teams can't be changed here. Contact the organizer." };
  if (team.captainId === user.id) return { ok: false as const, error: "Captains can delete the team instead of leaving it." };
  await prisma.teamMember.deleteMany({ where: { teamId, userId: user.id } });
  revalidatePath("/teams");
  return { ok: true as const };
}

export async function removeTeammate(teamId: string, userId: string) {
  const user = await requireUser();
  const team = await assertCaptain(teamId, user.id);
  if (!team || team.status !== "FORMING") return { ok: false as const, error: "Members can only be removed before registration." };
  if (userId === user.id) return { ok: false as const, error: "Use delete team if you want to step down." };
  await prisma.teamMember.deleteMany({ where: { teamId, userId } });
  revalidatePath(`/teams/${teamId}`);
  return { ok: true as const };
}

export async function deleteTeam(teamId: string) {
  const user = await requireUser();
  const team = await assertCaptain(teamId, user.id);
  if (!team) return { ok: false as const, error: "Only the captain can delete the team." };
  if (team.status === "REGISTERED") return { ok: false as const, error: "Cancel the registration before deleting the team." };
  await prisma.team.delete({ where: { id: teamId } });
  revalidatePath("/teams");
  return { ok: true as const };
}

export async function registerTeam(teamId: string, responses: Record<string, string>) {
  const user = await requireUser();
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { event: { include: { fields: true } }, members: { include: { user: { include: { profile: true } } } }, captain: true },
  });
  if (!team || team.captainId !== user.id) return { ok: false as const, error: "Only the captain can register the team." };
  if (team.status === "REGISTERED") return { ok: false as const, error: "This team is already registered." };
  if (team.event.registrationMode === "SOLO") return { ok: false as const, error: "This event does not accept teams." };
  if (!registrationOpen(team.event)) return { ok: false as const, error: "Registration is closed." };
  if (team.members.length < team.event.minTeamSize) {
    return { ok: false as const, error: `Add at least ${team.event.minTeamSize} members before registering.` };
  }
  if (team.members.length > team.event.maxTeamSize) {
    return { ok: false as const, error: `Teams can have at most ${team.event.maxTeamSize} members.` };
  }
  const incomplete = team.members.find((member) => !member.user.profile?.rollNumber || !member.user.profile.department);
  if (incomplete) return { ok: false as const, error: `${incomplete.user.name} still needs to complete their profile.` };
  const validated = validateFieldResponses(team.event.fields, responses, "TEAM");
  if ("error" in validated && validated.error) return { ok: false as const, error: validated.error };
  const responsesClean = "clean" in validated ? validated.clean : [];

  try {
    const result = await prisma.$transaction(async (tx) => {
      for (const member of team.members) {
        const existing = await tx.registrationParticipant.findFirst({
          where: { eventId: team.eventId, userId: member.userId, registration: { status: { in: activeStatuses() } } },
        });
        if (existing) throw new Error(`ALREADY:${member.user.name}`);
      }
      const activeCount = await tx.registrationParticipant.count({
        where: { eventId: team.eventId, registration: { status: { in: ["CONFIRMED", "ATTENDED", "PENDING", "WAITLISTED"] } } },
      });
      const status = team.event.maxParticipants && activeCount + team.members.length > team.event.maxParticipants ? "WAITLISTED" : "CONFIRMED";
      const code = await allocateCode(tx, team.eventId, team.event.registrationPrefix);
      const registration = await tx.registration.create({
        data: {
          eventId: team.eventId,
          userId: user.id,
          teamId: team.id,
          code,
          status,
          responses: { create: responsesClean },
        },
      });
      for (const member of team.members) {
        const participant = await tx.registrationParticipant.create({
          data: {
            registrationId: registration.id,
            eventId: team.eventId,
            userId: member.userId,
            dedupeKey: dedupeFor(team.event.allowDuplicate, member.userId, registration.id),
          },
        });
        if (status === "CONFIRMED") await ensurePass(tx, participant.id);
      }
      await tx.team.update({ where: { id: team.id }, data: { status: "REGISTERED" } });
      return { code, status };
    });
    await Promise.all(team.members.map((member) => notifyUser({
      userId: member.userId,
      type: "REGISTRATION_SUCCESS",
      title: result.status === "WAITLISTED" ? `${team.name} is waitlisted` : `${team.name} is registered`,
      body: `${team.event.name} · ${result.code}`,
      href: "/registrations",
      email: {
        to: member.user.email,
        subject: `${team.name} · ${result.code}`,
        text: `Your team ${team.name} is ${result.status.toLowerCase()} for ${team.event.name}.\nRegistration ID: ${result.code}\n\n${appUrl()}/registrations`,
      },
    })));
    revalidatePath("/teams");
    revalidatePath("/registrations");
    revalidatePath(`/events/${team.event.slug}`);
    return { ok: true as const, ...result };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("ALREADY:")) {
      return { ok: false as const, error: `${error.message.slice(8)} is already registered for this event.` };
    }
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { ok: false as const, error: "A teammate is already registered for this event." };
    }
    throw error;
  }
}
