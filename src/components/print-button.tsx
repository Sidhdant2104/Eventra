"use client";

export function PrintButton() {
  return <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white" onClick={() => window.print()}>Download / print</button>;
}
