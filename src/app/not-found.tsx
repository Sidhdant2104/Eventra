import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <h1 className="font-display text-6xl">That page is not here.</h1>
      <p className="mt-3 text-sm text-muted">The event, pass, or certificate may have been moved.</p>
      <ButtonLink href="/" className="mt-6 w-fit">Back home</ButtonLink>
    </main>
  );
}
