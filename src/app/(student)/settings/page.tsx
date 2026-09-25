import Link from "next/link";
import { DisconnectMethod } from "@/components/disconnect-method";
import { signIn } from "@/lib/auth";
import { EmailVerifyForm } from "@/components/email-verify-form";
import { githubAuthEnabled, googleAuthEnabled } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { maskPhone } from "@/lib/phone";
import { requireUser } from "@/lib/permissions";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ linked?: string; error?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const identities = await prisma.authIdentity.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const google = identities.find((item) => item.provider === "google");
  const github = identities.find((item) => item.provider === "github");
  const phone = identities.find((item) => item.provider === "phone");
  const emailIdentity = identities.find((item) => item.provider === "email");

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Account</p>
        <h1 className="mt-2 font-display text-5xl">Settings</h1>
        {query.linked ? <p className="mt-3 text-sm text-good">Login method connected.</p> : null}
        {query.error ? <p className="mt-3 text-sm text-bad">That login is already connected to another account.</p> : null}
      </div>

      <section>
        <h2 className="text-sm font-medium">Account</h2>
        <p className="mt-2 text-sm text-secondary">{user.name}</p>
        <p className="text-sm text-muted">{user.email ?? "No email on this account yet"}</p>
        <EmailVerifyForm current={user.email ?? ""} />
        <p className="mt-2 text-xs text-muted">{user.emailVerified ? "Email verified" : "Email is not verified yet."}</p>
      </section>

      <section>
        <h2 className="text-sm font-medium">Login methods</h2>
        <p className="mt-2 text-sm text-secondary">Every method signs into this same account.</p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          <Method
            name="Google"
            detail={google ? "Connected" : "Not connected"}
            action={google ? <DisconnectMethod provider="google" /> : googleAuthEnabled ? <Connect provider="google" /> : <span className="text-xs text-muted">Not configured</span>}
          />
          <Method
            name="GitHub"
            detail={github ? "Connected" : "Not connected"}
            action={github ? <DisconnectMethod provider="github" /> : githubAuthEnabled ? <Connect provider="github" /> : <span className="text-xs text-muted">Not configured</span>}
          />
          <Method
            name="Phone"
            detail={phone ? `${maskPhone(phone.providerAccountId)} · Verified` : "Not connected"}
            action={phone ? <DisconnectMethod provider="phone" /> : <Link href="/login/phone" className="text-sm font-medium">Verify</Link>}
          />
          <Method
            name="Email"
            detail={user.email ? `${user.email}${emailIdentity || user.passwordHash ? "" : ""}` : "Not connected"}
            action={<span className="text-xs text-muted">{user.emailVerified ? "Verified" : user.passwordHash ? "Password set" : "Use verification above"}</span>}
          />
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium">Profile</h2>
        <p className="mt-2 text-sm text-secondary">Name, academics, skills, and links live on your profile.</p>
        <Link href="/profile" className="mt-3 inline-block text-sm font-medium">Open profile</Link>
      </section>

      <section>
        <h2 className="text-sm font-medium">Privacy</h2>
        <p className="mt-2 text-sm text-muted">Profile visibility controls will live here. Other students cannot read this account through the profile API.</p>
      </section>
      <section>
        <h2 className="text-sm font-medium">Notifications</h2>
        <p className="mt-2 text-sm text-muted">Event and team alerts already arrive in the notification inbox. Delivery preferences will be added with those modules.</p>
      </section>
      <section>
        <h2 className="text-sm font-medium">Security</h2>
        <p className="mt-2 text-sm text-muted">Sessions expire after 14 days. <Link href="/forgot-password" className="font-medium text-ink">Reset password</Link> if this account uses email sign-in.</p>
      </section>
    </div>
  );
}

function Method({ name, detail, action }: { name: string; detail: string; action: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3 text-sm">
      <span><span className="block font-medium">{name}</span><span className="text-muted">{detail}</span></span>
      {action}
    </li>
  );
}

function Connect({ provider }: { provider: "google" | "github" }) {
  return (
    <form action={async () => {
      "use server";
      await signIn(provider, { redirectTo: "/settings?linked=1" });
    }}>
      <button className="text-sm font-medium" type="submit">Connect</button>
    </form>
  );
}

