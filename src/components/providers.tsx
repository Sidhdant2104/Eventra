"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-center" />
    </SessionProvider>
  );
}

export function PwaRegister() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `if ("serviceWorker" in navigator) { window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {})); }`,
      }}
    />
  );
}
