import { appendFile } from "fs/promises";
import path from "path";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(message: EmailMessage) {
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  if (provider === "console") {
    const entry = [`--- ${new Date().toISOString()} ---`, `To: ${message.to}`, `Subject: ${message.subject}`, message.text, ""].join("\n");
    console.info(`\n[email:console]\n${entry}`);
    await appendFile(path.join(process.cwd(), ".dev-emails.log"), entry);
    return { id: `console-${Date.now()}`, provider: "console" as const };
  }
  if (provider === "resend") {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!key || !from) throw new Error("Resend is selected but RESEND_API_KEY or EMAIL_FROM is missing.");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: message.to, subject: message.subject, text: message.text, html: message.html }),
    });
    if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
    const body = (await response.json()) as { id?: string };
    return { id: body.id ?? "resend", provider: "resend" as const };
  }
  throw new Error(`Unknown email provider: ${provider}`);
}
