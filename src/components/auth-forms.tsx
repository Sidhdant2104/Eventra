"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Label } from "@/components/ui";
import { registerAccount, requestPasswordReset, resetPassword } from "@/lib/actions/auth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/constants";
import { safeCallback } from "@/lib/utils";
import { registerSchema } from "@/lib/validators";

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export function LoginForm({ callbackUrl, google, showDemo }: { callbackUrl?: string; google: boolean; showDemo: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setPending(true);
    setError(null);
    const result = await signIn("credentials", { ...values, redirect: false });
    if (result?.error) {
      setPending(false);
      setError("Those details don't match an account.");
      return;
    }
    const session = await getSession();
    const role = session?.user?.role;
    const destination = safeCallback(callbackUrl, role && role !== "STUDENT" ? "/admin" : "/home");
    router.push(destination);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {error ? <Alert>{error}</Alert> : null}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
        </div>
        <Button className="w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
      </form>
      {google ? <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: safeCallback(callbackUrl, "/home") })}>Continue with Google</Button> : null}
      <p className="text-sm text-muted">New here? <Link className="font-semibold text-ink" href="/register">Create a student account</Link></p>
      <p className="text-sm"><Link className="font-medium" href="/forgot-password">Forgot password</Link></p>
      {showDemo ? (
        <details className="rounded-2xl bg-paper p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Demo accounts</summary>
          <p className="mt-2 text-muted">Password for every demo account: {DEMO_PASSWORD}</p>
          <ul className="mt-3 space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button type="button" className="text-left" onClick={() => { form.setValue("email", account.email); form.setValue("password", DEMO_PASSWORD); }}>
                  <span className="font-medium">{account.role}</span>
                  <span className="block text-muted">{account.email} · {account.note}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const form = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", password: "" } });

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setPending(true);
      setError(null);
      const created = await registerAccount(values);
      if (!created.ok) {
        setPending(false);
        setError(created.error);
        return;
      }
      const signedIn = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
      if (signedIn?.error) {
        router.push("/login");
        return;
      }
      router.push("/profile?complete=1");
      router.refresh();
    })}>
      {error ? <Alert>{error}</Alert> : null}
      <div><Label htmlFor="name">Full name</Label><Input id="name" autoComplete="name" {...form.register("name")} />{form.formState.errors.name ? <p className="mt-1 text-sm text-bad">{form.formState.errors.name.message}</p> : null}</div>
      <div><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" {...form.register("email")} />{form.formState.errors.email ? <p className="mt-1 text-sm text-bad">{form.formState.errors.email.message}</p> : null}</div>
      <div><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />{form.formState.errors.password ? <p className="mt-1 text-sm text-bad">{form.formState.errors.password.message}</p> : null}</div>
      <Button className="w-full" disabled={pending}>{pending ? "Creating account…" : "Create account"}</Button>
      <p className="text-sm text-muted">Already registered? <Link className="font-semibold text-ink" href="/login">Sign in</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      const email = String(new FormData(event.currentTarget).get("email") ?? "");
      const result = await requestPasswordReset(email);
      setPending(false);
      setMessage("If an account exists, a reset link is on its way.");
      setLink(result.devLink);
    }}>
      {message ? <Alert tone="good">{message}</Alert> : null}
      {link ? <Alert tone="warn">Local email fallback: <a className="underline" href={link}>open reset link</a></Alert> : null}
      <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
      <Button className="w-full" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      const password = String(new FormData(event.currentTarget).get("password") ?? "");
      const result = await resetPassword(token, password);
      setPending(false);
      if (!result.ok) setError(result.error);
      else router.push("/login");
    }}>
      {error ? <Alert>{error}</Alert> : null}
      <div><Label htmlFor="password">New password</Label><Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" /></div>
      <Button className="w-full" disabled={pending}>{pending ? "Saving…" : "Update password"}</Button>
    </form>
  );
}
