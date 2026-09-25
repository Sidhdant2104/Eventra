"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Alert, Button, Input, Label } from "@/components/ui";
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/actions/phone-auth";
import { safeCallback } from "@/lib/utils";

export function PhoneAuthForm({ callbackUrl, linking = false }: { callbackUrl?: string; linking?: boolean }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-4">
      {error ? <Alert>{error}</Alert> : null}
      {devCode ? <Alert tone="warn">Development code: {devCode}. This is not shown in production.</Alert> : null}
      {!sent ? (
        <form className="space-y-4" onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const result = await requestPhoneOtp(phone);
          setPending(false);
          if (!result.ok) setError(result.error);
          else {
            setPhone(result.phone);
            setDevCode(result.devCode);
            setSent(true);
          }
        }}>
          <div><Label htmlFor="phone">Mobile number</Label><Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="9876543210" autoComplete="tel" required /></div>
          <Button className="w-full" disabled={pending}>{pending ? "Sending…" : "Send code"}</Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const result = await verifyPhoneOtp(phone, code);
          if (!result.ok) {
            setPending(false);
            setError(result.error);
            return;
          }
          if (result.linked || !result.token) {
            window.location.href = "/settings";
            return;
          }
          const signedIn = await signIn("phone", { token: result.token, redirect: false });
          setPending(false);
          if (signedIn?.error) setError("The code was accepted, but the session could not be started. Request a new code.");
          else window.location.href = linking ? "/settings" : safeCallback(callbackUrl, "/home");
        }}>
          <div><Label htmlFor="code">6-digit code</Label><Input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} required /></div>
          <Button className="w-full" disabled={pending}>{pending ? "Checking…" : linking ? "Verify phone" : "Continue"}</Button>
          <button type="button" className="text-sm text-muted" onClick={() => { setSent(false); setDevCode(null); }}>Use a different number</button>
        </form>
      )}
    </div>
  );
}
