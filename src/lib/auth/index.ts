import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { privyServer } from "./privy-server";
import { Role } from "@prisma/client";

export type AppSession = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
  };
};

export async function getSession(): Promise<AppSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("privy-token")?.value;
    if (!token) return null;

    const { userId: privyDid } = await privyServer.verifyAuthToken(token);
    const user = await db.user.findUnique({ where: { privyDid } });
    if (!user) return null;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AppSession> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireRole(role: Role): Promise<AppSession> {
  const session = await requireAuth();
  if (session.user.role !== role) throw new Error("Forbidden");
  return session;
}
