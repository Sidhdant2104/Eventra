import { confirmEmail } from "@/lib/actions/auth";
import Link from "next/link";

export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const result = token ? await confirmEmail(token) : { ok: false as const, error: "This verification link is invalid or has expired." };
  return (
    <main id="content" className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-5xl">{result.ok ? "Email verified." : "Could not verify."}</h1>
      <p className="mt-3 text-sm text-secondary">{result.ok ? "This address is now confirmed on your NMIET One account." : result.error}</p>
      <Link href="/settings" className="mt-6 inline-block text-sm font-medium">Back to settings</Link>
    </main>
  );
}
