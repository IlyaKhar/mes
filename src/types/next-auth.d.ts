import type { Department, Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    department: Department;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      department: Department;
      avatarUrl?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    department: Department;
    avatarUrl?: string | null;
  }
}
