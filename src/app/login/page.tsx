import { AuthFrame } from "@/components/auth-frame";
import { LoginForm } from "@/components/auth-forms";
import { googleAuthEnabled } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const params = await searchParams;
  return (
    <AuthFrame title="Welcome back." subtitle="Use the same account for every club event, pass, and certificate.">
      <LoginForm callbackUrl={params.callbackUrl} google={googleAuthEnabled} showDemo={process.env.NODE_ENV === "development" && process.env.DEMO_MODE !== "false"} />
    </AuthFrame>
  );
}
