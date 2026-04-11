import { PrivyClient } from "@privy-io/server-auth";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;

if (!appId || !appSecret) {
  // Will fail at runtime when actually used, not at import time
}

export const privyServer = new PrivyClient(appId!, appSecret!);
