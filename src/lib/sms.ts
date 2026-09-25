export type SmsMessage = { to: string; body: string };

export async function sendSms(message: SmsMessage) {
  const provider = process.env.SMS_PROVIDER ?? (process.env.NODE_ENV === "production" ? "unconfigured" : "console");
  if (provider === "console") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Phone sign-in is not available right now.");
    }
    console.info(`\n[sms:console]\nTo: ${message.to}\n${message.body}\n`);
    return { provider: "console" as const };
  }
  if (provider === "unconfigured") {
    throw new Error("Phone sign-in is not available right now.");
  }
  throw new Error("Phone sign-in is not available right now.");
}

export function smsDevMode() {
  return process.env.NODE_ENV !== "production" && (process.env.SMS_PROVIDER ?? "console") === "console";
}
