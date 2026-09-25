import { PlatformRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: PlatformRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: PlatformRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: PlatformRole;
  }
}
