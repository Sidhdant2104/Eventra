"use client";

import { useState } from "react";
import { disconnectLoginMethod } from "@/lib/actions/account-link";

export function DisconnectMethod({ provider }: { provider: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form className="text-right" onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      setError(null);
      const result = await disconnectLoginMethod(provider);
      setPending(false);
      if (!result.ok) setError(result.error);
    }}>
      <button className="text-sm text-muted" type="submit" disabled={pending}>{pending ? "Removing…" : "Disconnect"}</button>
      {error ? <p className="mt-1 max-w-48 text-xs text-bad">{error}</p> : null}
    </form>
  );
}
