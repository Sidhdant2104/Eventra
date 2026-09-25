import { AuthFrame } from "@/components/auth-frame";
import { LoginForm } from "@/components/auth-forms";
import { githubAuthEnabled, googleAuthEnabled } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthFrame title="Welcome back." subtitle="One account for every club, pass, and certificate.">
      <LoginForm
        callbackUrl={params.callbackUrl}
        google={googleAuthEnabled}
        github={githubAuthEnabled}
        errorCode={params.error}
        showDemo={process.env.NODE_ENV === "development" && process.env.DEMO_MODE !== "false"}
      />
    </AuthFrame>
  );
}
