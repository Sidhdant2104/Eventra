import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  email?: { to: string; subject: string; text: string };
};

export async function notifyUser(input: NotifyInput) {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    },
  });
  if (input.email) {
    try {
      await sendEmail(input.email);
    } catch (error) {
      console.error("Email delivery failed", error);
    }
  }
}

export async function notifyMany(
  userIds: string[],
  payload: { type: NotificationType; title: string; body: string; href?: string },
) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({ userId, ...payload })),
  });
}

export async function emailUsers(messages: { to: string; subject: string; text: string }[]) {
  await Promise.all(
    messages.map(async (message) => {
      try {
        await sendEmail(message);
      } catch (error) {
        console.error("Email delivery failed", error);
      }
    }),
  );
}

export type Tx = Prisma.TransactionClient;
