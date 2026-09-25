import { AuthFrame } from "@/components/auth-frame";
import { ResetForm } from "@/components/auth-forms";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return (
    <AuthFrame title="Choose a new password." subtitle="Use at least 8 characters.">
      {params.token ? <ResetForm token={params.token} /> : <p className="text-sm text-bad">This reset link is missing a token.</p>}
    </AuthFrame>
  );
}
