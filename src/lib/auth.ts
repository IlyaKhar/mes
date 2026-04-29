import type { Department, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/db";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: Department;
  avatarUrl?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      avatarUrl: true,
      isBanned: true
    }
  });

  if (!user || user.isBanned) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    avatarUrl: user.avatarUrl
  };
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) redirect("/login");

  return user;
}
