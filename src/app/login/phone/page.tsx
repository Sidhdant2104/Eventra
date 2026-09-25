import { AuthFrame } from "@/components/auth-frame";
import { PhoneAuthForm } from "@/components/phone-auth-form";
import { getCurrentUser } from "@/lib/permissions";

export const metadata = { title: "Phone sign-in" };

export default async function PhoneLoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  return (
    <AuthFrame title={user ? "Add your phone." : "Continue with phone."} subtitle={user ? "The code verifies this number and links it to the account you are already using." : "We will text a short code. It expires in five minutes."}>
      <PhoneAuthForm callbackUrl={params.callbackUrl} linking={Boolean(user)} />
    </AuthFrame>
  );
}
