import { AuthFrame } from "@/components/auth-frame";
import { RegisterForm } from "@/components/auth-forms";

export default function RegisterPage() {
  return (
    <AuthFrame title="Create your student account." subtitle="You will fill your department, year, and roll number once. Events will not ask for them again.">
      <RegisterForm />
    </AuthFrame>
  );
}
