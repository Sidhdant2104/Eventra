import { FieldAppliesTo, FieldType, Prisma, RegistrationStatus } from "@prisma/client";
import { randomToken } from "@/lib/crypto";

type Field = {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: Prisma.JsonValue;
  appliesTo: FieldAppliesTo;
};

export function activeStatuses(): RegistrationStatus[] {
  return ["PENDING", "CONFIRMED", "WAITLISTED", "ATTENDED"];
}

export function validateFieldResponses(fields: Field[], responses: Record<string, string>, mode: "SOLO" | "TEAM") {
  const relevant = fields.filter((field) => field.appliesTo === "BOTH" || field.appliesTo === mode);
  const clean: { fieldId: string; value: string }[] = [];
  for (const field of relevant) {
    const value = (responses[field.key] ?? "").trim();
    if (field.required && !value) return { error: `${field.label} is required.` };
    if (!value) continue;
    if (value.length > 2000) return { error: `${field.label} is too long.` };
    if (field.type === "URL" && !/^https?:\/\/\S+$/i.test(value)) return { error: `${field.label} must start with http:// or https://.` };
    if (field.type === "NUMBER" && Number.isNaN(Number(value))) return { error: `${field.label} must be a number.` };
    if (field.type === "SELECT" && Array.isArray(field.options) && field.options.length > 0) {
      const options = field.options.map(String);
      if (!options.includes(value)) return { error: `Choose a valid option for ${field.label}.` };
    }
    clean.push({ fieldId: field.id, value });
  }
  return { clean };
}

export async function allocateCode(tx: Prisma.TransactionClient, eventId: string, prefix: string) {
  const updated = await tx.event.update({
    where: { id: eventId },
    data: { registrationSeq: { increment: 1 } },
    select: { registrationSeq: true },
  });
  return `NMIET-${prefix}-${String(updated.registrationSeq).padStart(4, "0")}`;
}

export async function ensurePass(tx: Prisma.TransactionClient, participantId: string) {
  const existing = await tx.qrPass.findUnique({ where: { participantId } });
  if (existing) return existing;
  return tx.qrPass.create({ data: { participantId, token: randomToken() } });
}

export function dedupeFor(allowDuplicate: boolean, userId: string, registrationId: string) {
  return allowDuplicate ? `${userId}:${registrationId}` : userId;
}
