import { AuthFrame } from "@/components/auth-frame";
import { LoginForm } from "@/components/auth-forms";
import { Alert } from "@/components/ui";
import { consumePendingLink } from "@/lib/actions/account-link";
import { githubAuthEnabled, googleAuthEnabled } from "@/lib/auth";
import { getCurrentUser } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const metadata = { title: "Connect login" };

export default async function LinkAccountPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const user = await getCurrentUser();
  if (!token) redirect("/login");
  let error: string | null = null;
  if (user) {
    const result = await consumePendingLink(token);
    if (result.ok) redirect("/settings?linked=1");
    error = result.error;
  }
  const callbackUrl = `/login/link?token=${encodeURIComponent(token)}`;
  return (
    <AuthFrame title="Connect this login." subtitle="An NMIET One account already exists with this email. Sign in to that account to connect the provider. We will not create a second account.">
      {error ? <Alert>{error}</Alert> : null}
      {user ? <p className="mb-4 text-sm text-secondary">You are signed in as {user.email ?? "a phone account"}. Sign out and use the account that owns this email.</p> : null}
      <LoginForm callbackUrl={callbackUrl} google={googleAuthEnabled} github={githubAuthEnabled} showDemo={process.env.NODE_ENV === "development" && process.env.DEMO_MODE !== "false"} />
    </AuthFrame>
  );
}
