import { NextRequest, NextResponse } from "next/server";
import { privyServer } from "@/lib/auth/privy-server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

/**
 * Called by the client after Privy login to create/find the DB user record.
 * Expects `privy-token` cookie (set automatically by Privy SDK).
 * Body: { role?: "USER" | "CREATOR" }  — only used when creating a new user.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get("privy-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let privyDid: string;
  let privyUser: Awaited<ReturnType<typeof privyServer.getUser>>;

  try {
    const verified = await privyServer.verifyAuthToken(token);
    privyDid = verified.userId;
    privyUser = await privyServer.getUser(privyDid);
  } catch {
    return NextResponse.json({ error: "Invalid Privy token" }, { status: 401 });
  }

  // Extract email from Privy linked accounts
  const emailAccount = privyUser.linkedAccounts.find(
    (a) => a.type === "email"
  ) as { type: "email"; address: string } | undefined;
  const walletAccount = privyUser.linkedAccounts.find(
    (a) => a.type === "wallet"
  ) as { type: "wallet"; address: string } | undefined;

  const email =
    emailAccount?.address ??
    privyUser.google?.email ??
    privyUser.github?.email ??
    privyUser.twitter?.username ??
    (walletAccount?.address ? `${walletAccount.address}@wallet.privy` : null) ??
    `${privyDid}@privy.user`;

  const name =
    privyUser.google?.name ??
    privyUser.github?.name ??
    privyUser.twitter?.name ??
    null;

  // Parse desired role from body (only applies on new user creation)
  const body = await req.json().catch(() => ({}));
  const roleInput = body.role === "CREATOR" ? Role.CREATOR : Role.USER;

  // Upsert: find by privyDid first, then by email
  let user = await db.user.findUnique({ where: { privyDid } });

  if (!user) {
    // Try linking an existing email-based account
    user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      // Link existing account to Privy
      user = await db.user.update({
        where: { id: user.id },
        data: { privyDid },
      });
    } else {
      // Brand new user
      user = await db.user.create({
        data: {
          privyDid,
          email: email.toLowerCase(),
          name,
          role: roleInput,
          ...(roleInput === Role.CREATOR
            ? { creatorBalance: { create: {} } }
            : {}),
        },
      });
    }
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
