import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userType: "STUDENT" | "COMPANY" | "ADMIN";
      email: string;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    email: string;
    userType: "STUDENT" | "COMPANY" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    userType: "STUDENT" | "COMPANY" | "ADMIN";
  }
}

