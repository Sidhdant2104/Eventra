"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <h1 className="font-display text-6xl">Something went wrong.</h1>
      <p className="mt-3 text-sm text-muted">The page could not be loaded. Try again, or come back in a moment.</p>
      <button className="mt-6 w-fit rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white" onClick={() => reset()}>Try again</button>
    </main>
  );
}
