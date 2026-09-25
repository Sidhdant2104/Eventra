"use client";

import { useEffect, useRef, useState } from "react";
import { lookupPass, markAttendance } from "@/lib/actions/attendance";
import { Alert, Button, Input } from "@/components/ui";

type Result = {
  state: "valid" | "already" | "invalid" | "checked";
  message: string;
  name?: string;
  team?: string | null;
  code?: string;
  checkedInAt?: string;
};

export function Scanner({ eventId }: { eventId: string }) {
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const lastScan = useRef("");
  const regionId = "qr-reader";

  useEffect(() => {
    let scanner: { stop: () => Promise<void> } | null = null;
    let stopped = false;
    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const instance = new Html5Qrcode(regionId);
        scanner = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          async (decoded) => {
            if (stopped || decoded === lastScan.current) return;
            lastScan.current = decoded;
            const response = await lookupPass(eventId, decoded);
            if (response.ok) setResult(response);
            else setError(response.error);
          },
          () => {},
        );
      } catch {
        if (!stopped) setCameraError("Camera access is unavailable. Enter the pass token instead.");
      }
    }
    void start();
    return () => {
      stopped = true;
      void scanner?.stop().catch(() => {});
    };
  }, [eventId]);

  async function submit(raw: string) {
    setPending(true);
    setError(null);
    const response = await lookupPass(eventId, raw);
    setPending(false);
    if (!response.ok) setError(response.error);
    else setResult(response);
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,460px)_1fr]">
      <div>
        <div id={regionId} className="min-h-[280px] overflow-hidden bg-ink" />
        {cameraError ? <p className="mt-3 text-sm text-muted">{cameraError}</p> : <p className="mt-3 text-sm text-muted">Hold the pass inside the frame.</p>}
        <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); void submit(manual); }}>
          <Input value={manual} onChange={(event) => setManual(event.target.value)} placeholder="Or paste a pass link" aria-label="Pass token" />
          <Button variant="ink" disabled={pending}>Check</Button>
        </form>
      </div>
      <div>
        {error ? <Alert>{error}</Alert> : null}
        {result ? (
          <div className={`p-6 text-white ${result.state === "invalid" ? "bg-bad" : result.state === "already" ? "bg-[#8d5b00]" : "bg-ink"}`}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">{result.state === "valid" ? "Valid pass" : result.state === "invalid" ? "Invalid pass" : result.state === "checked" ? "Checked in" : "Already checked in"}</p>
            <h2 className="mt-3 font-display text-5xl text-white">{result.name ?? result.message}</h2>
            {result.team ? <p className="mt-3 text-sm uppercase tracking-[0.14em] text-accent">{result.team}</p> : null}
            {result.code ? <p className="mt-4 text-lg">{result.code}</p> : null}
            {result.checkedInAt ? <p className="mt-2 text-sm text-white/70">{result.checkedInAt}</p> : null}
            {result.state === "valid" ? (
              <Button className="mt-6" disabled={pending} onClick={async () => {
                setPending(true);
                const response = await markAttendance(eventId, manual || lastScan.current);
                setPending(false);
                if (!response.ok) setError(response.error);
                else setResult(response);
              }}>Check in</Button>
            ) : null}
          </div>
        ) : <div className="border border-dashed border-line px-6 py-16 text-sm text-muted">Waiting for a pass.</div>}
      </div>
    </div>
  );
}
