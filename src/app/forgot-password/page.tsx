import { AuthFrame } from "@/components/auth-frame";
import { ForgotForm } from "@/components/auth-forms";

export default function ForgotPage() {
  return (
    <AuthFrame title="Reset your password." subtitle="We'll email a link that expires in one hour. In local development, the link also appears on this page.">
      <ForgotForm />
    </AuthFrame>
  );
}
