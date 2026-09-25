import { createHash, randomBytes } from "crypto";

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function certificatePublicId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let id = "NMIET-CERT-";
  for (let index = 0; index < 8; index += 1) {
    id += alphabet[bytes[index]! % alphabet.length];
  }
  return id;
}
