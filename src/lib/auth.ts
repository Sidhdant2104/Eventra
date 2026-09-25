import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { decode } from "next-auth/jwt";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";
import { decideOAuthSignIn } from "@/lib/auth-policy";
import { hashToken, randomToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { clearLimit, isLimited, noteFailure } from "@/lib/rate-limit";

async function sessionUserId() {
  const jar = await cookies();
  const secureName = "__Secure-authjs.session-token";
  const plainName = "authjs.session-token";
  const secure = jar.get(secureName)?.value;
  const plain = jar.get(plainName)?.value;
  const token = secure ?? plain;
  if (!token || !process.env.AUTH_SECRET) return null;
  const decoded = await decode({ token, secret: process.env.AUTH_SECRET, salt: secure ? secureName : plainName });
  return typeof decoded?.id === "string" ? decoded.id : null;
}

async function githubVerifiedEmail(accessToken: string) {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "NMIET-One",
    },
  });
  if (!response.ok) return null;
  const emails = (await response.json()) as { email?: string; primary?: boolean; verified?: boolean }[];
  const primary = emails.find((item) => item.primary && item.verified && item.email);
  return primary?.email?.toLowerCase() ?? null;
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = String(credentials?.email ?? "").toLowerCase().trim();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;
      const limitKey = `password:${email}`;
      if (isLimited(limitKey, 8)) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash || user.status !== "ACTIVE") {
        noteFailure(limitKey, 8, 15 * 60 * 1000);
        return null;
      }
      const valid = await compare(password, user.passwordHash);
      if (!valid) {
        noteFailure(limitKey, 8, 15 * 60 * 1000);
        return null;
      }
      clearLimit(limitKey);
      return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
    },
  }),
  Credentials({
    id: "phone",
    name: "phone",
    credentials: { token: { label: "Token", type: "text" } },
    authorize: async (credentials) => {
      const token = String(credentials?.token ?? "");
      if (!token) return null;
      const grant = await prisma.loginGrant.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
      if (!grant || grant.consumedAt || grant.expiresAt.getTime() < Date.now() || grant.user.status !== "ACTIVE") return null;
      const consumed = await prisma.loginGrant.updateMany({
        where: { id: grant.id, consumedAt: null, expiresAt: { gt: new Date() } },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) return null;
      return { id: grant.user.id, email: grant.user.email, name: grant.user.name, image: grant.user.image, role: grant.user.role };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET }));
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: { params: { scope: "read:user user:email" } },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login", error: "/login" },
  providers,
  callbacks: {
    async signIn({ account, profile, user }) {
      if (!account || account.provider === "credentials" || account.provider === "phone") {
        return true;
      }
      if (account.provider !== "google" && account.provider !== "github") return true;
      const providerAccountId = account.providerAccountId;
      const linked = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider: account.provider, providerAccountId } },
        include: { user: true },
      });
      let verifiedEmail: string | null = null;
      if (account.provider === "google") {
        const google = profile as { email?: string; email_verified?: boolean } | undefined;
        verifiedEmail = google?.email_verified && google.email ? google.email.toLowerCase() : null;
      } else if (account.access_token) {
        verifiedEmail = await githubVerifiedEmail(account.access_token);
      }
      const existing = verifiedEmail ? await prisma.user.findUnique({ where: { email: verifiedEmail } }) : null;
      const decision = decideOAuthSignIn({
        sessionUserId: await sessionUserId(),
        linkedUserId: linked?.userId ?? null,
        linkedStatus: linked?.user.status ?? null,
        verifiedEmail,
        existingUserId: existing?.id ?? null,
        existingEmailVerified: Boolean(existing?.emailVerified),
        existingStatus: existing?.status ?? null,
      });
      if (decision.action === "reject") return `/login?error=${decision.error}`;
      if (decision.action === "link-required") {
        const token = randomToken();
        await prisma.pendingAuthLink.create({
          data: {
            tokenHash: hashToken(token),
            provider: account.provider,
            providerAccountId,
            providerEmail: decision.email,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        });
        return `/login/link?token=${token}`;
      }
      if (user && "status" in user && user.status === "SUSPENDED") return "/login?error=suspended";
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        const row = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
        token.role = row?.role ?? user.role ?? "STUDENT";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, college: "NMIET" },
      });
    },
    async linkAccount({ user, account, profile }) {
      if (!user.id || account.provider === "credentials" || account.provider === "phone") return;
      let providerEmail: string | null = null;
      if (account.provider === "google") {
        const google = profile as { email?: string; email_verified?: boolean } | undefined;
        providerEmail = google?.email_verified && google.email ? google.email.toLowerCase() : null;
      } else if (account.provider === "github" && account.access_token) {
        providerEmail = await githubVerifiedEmail(account.access_token);
      }
      if (providerEmail) {
        const row = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, emailVerified: true } });
        if (row?.email?.toLowerCase() === providerEmail && !row.emailVerified) {
          await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
        }
      }
      await prisma.authIdentity.upsert({
        where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } },
        update: { providerEmail },
        create: { userId: user.id, provider: account.provider, providerAccountId: account.providerAccountId, providerEmail },
      });
    },
  },
});

export const googleAuthEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
export const githubAuthEnabled = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
