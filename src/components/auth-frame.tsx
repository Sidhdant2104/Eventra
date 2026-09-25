import { Logo } from "@/components/logo";

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main id="content" className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
        <Logo light href="/" />
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">NMIET One</p>
          <h2 className="mt-4 max-w-md font-display text-6xl text-white">One profile. Every event. One campus.</h2>
        </div>
        <p className="text-sm text-white/50">Clubs, passes, teams, and certificates in one account.</p>
      </section>
      <section className="flex flex-col justify-center px-5 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden"><Logo /></div>
          <h1 className="mt-8 font-display text-5xl">{title}</h1>
          <p className="mt-3 text-[15px] leading-7 text-secondary">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
