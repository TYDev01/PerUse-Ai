import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ONE-TIME admin bootstrap endpoint — DELETE THIS FILE after use.
// Protected by ADMIN_SETUP_TOKEN env var.
export async function POST(req: NextRequest) {
  const token = process.env.ADMIN_SETUP_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Not configured" }, { status: 404 });
  }

  const auth = req.headers.get("x-setup-token");
  if (auth !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const user = await db.user.updateMany({
    where: { email },
    data: { role: "ADMIN" },
  });

  return NextResponse.json({ updated: user.count });
}
