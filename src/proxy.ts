import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PRIVATE = [
  /^\/home(?:\/|$)/,
  /^\/registrations(?:\/|$)/,
  /^\/teams(?:\/|$)/,
  /^\/certificates(?:\/|$)/,
  /^\/notifications(?:\/|$)/,
  /^\/profile(?:\/|$)/,
  /^\/admin(?:\/|$)/,
  /^\/events\/[^/]+\/register(?:\/|$)/,
  /^\/events\/[^/]+\/team(?:\/|$)/,
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PRIVATE.some((pattern) => pattern.test(pathname))) return NextResponse.next();
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (token) return NextResponse.next();
  const url = new URL("/login", request.url);
  url.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|covers|uploads|brand|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
