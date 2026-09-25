import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function readSessionUserId() {
  const jar = await cookies();
  const secureName = "__Secure-authjs.session-token";
  const plainName = "authjs.session-token";
  const secure = jar.get(secureName)?.value;
  const plain = jar.get(plainName)?.value;
  const token = secure ?? plain;
  const salt = secure ? secureName : plainName;
  if (!token || !process.env.AUTH_SECRET) return null;
  const decoded = await decode({ token, secret: process.env.AUTH_SECRET, salt });
  const id = decoded?.id;
  return typeof id === "string" ? id : null;
}
