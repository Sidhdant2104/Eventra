"use client";

import { useState } from "react";
import { Alert, Button, Input, Label } from "@/components/ui";
import { requestEmailVerification } from "@/lib/actions/auth";

export function EmailVerifyForm({ current }: { current: string }) {
  const [email, setEmail] = useState(current);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      setError(null);
      setMessage(null);
      const result = await requestEmailVerification(email);
      setPending(false);
      if (!result.ok) setError(result.error);
      else {
        setMessage("Check that inbox for a verification link.");
        setLink(result.devLink);
      }
    }}>
      <div className="min-w-[220px] flex-1">
        <Label htmlFor="account-email">Email</Label>
        <Input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <Button size="sm" disabled={pending}>{pending ? "Sending…" : "Send verification"}</Button>
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="good">{message}</Alert> : null}
      {link ? <Alert tone="warn">Development link: <a className="underline" href={link}>verify email</a></Alert> : null}
    </form>
  );
}
