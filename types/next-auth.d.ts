import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      businessName: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    businessName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    businessName?: string;
  }
}
