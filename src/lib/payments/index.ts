/**
 * Locus Checkout payment service.
 * Wraps https://api.paywithlocus.com/api/checkout/...
 *
 * In dev mode (PAYMENT_MOCK_MODE=true), all sessions are auto-confirmed
 * after a short delay without hitting the real API.
 */

const LOCUS_API_BASE =
  process.env.LOCUS_API_BASE ?? "https://api.paywithlocus.com/api";
const LOCUS_API_KEY = process.env.LOCUS_API_KEY ?? "";
const MOCK_MODE = process.env.PAYMENT_MOCK_MODE === "true";

function locusFetch(path: string, init?: RequestInit) {
  return fetch(`${LOCUS_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${LOCUS_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export interface CheckoutSession {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  checkoutUrl?: string;
  expiresAt?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status?: string;
  error?: string;
}

/** Create a Locus checkout session for the given amount (in USDC). */
export async function createCheckoutSession(params: {
  amount: number;
  description: string;
  metadata?: Record<string, string>;
  webhookUrl?: string;
}): Promise<CheckoutSession> {
  if (MOCK_MODE) {
    return {
      id: `mock_session_${Date.now()}`,
      amount: params.amount,
      currency: "USDC",
      status: "PENDING",
      checkoutUrl: `http://localhost:3000/mock-checkout?amount=${params.amount}`,
    };
  }

  const res = await locusFetch("/checkout/sessions", {
    method: "POST",
    body: JSON.stringify({
      amount: params.amount.toFixed(6),
      currency: "USDC",
      description: params.description,
      metadata: params.metadata,
      webhookUrl: params.webhookUrl,
      receiptConfig: { enabled: true },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Checkout session creation failed: ${res.status}`);
  }

  const { data } = await res.json();
  return {
    id: data.id,
    amount: params.amount,
    currency: "USDC",
    status: "PENDING",
    checkoutUrl: data.checkoutUrl,
    expiresAt: data.expiresAt,
  };
}

/** Get the current status of a checkout session. */
export async function getCheckoutSession(
  sessionId: string
): Promise<CheckoutSession> {
  if (MOCK_MODE) {
    return {
      id: sessionId,
      amount: 0,
      currency: "USDC",
      status: sessionId.startsWith("mock_paid_") ? "PAID" : "PENDING",
    };
  }

  const res = await locusFetch(`/checkout/sessions/${sessionId}`);
  if (!res.ok) throw new Error(`Failed to fetch checkout session: ${res.status}`);

  const { data } = await res.json();
  return {
    id: data.id,
    amount: Number(data.amount),
    currency: data.currency ?? "USDC",
    status: data.status,
    checkoutUrl: data.checkoutUrl,
    expiresAt: data.expiresAt,
  };
}

/** Poll a payment transaction for confirmation. */
export async function pollPayment(transactionId: string): Promise<{
  status: "PENDING" | "QUEUED" | "PROCESSING" | "CONFIRMED" | "FAILED";
  txHash?: string;
}> {
  if (MOCK_MODE) {
    return { status: "CONFIRMED", txHash: `mock_tx_${Date.now()}` };
  }

  const res = await locusFetch(`/checkout/agent/payments/${transactionId}`);
  if (!res.ok) throw new Error(`Failed to poll payment: ${res.status}`);

  const { data } = await res.json();
  return {
    status: data.status,
    txHash: data.txHash,
  };
}

/**
 * Verify a Locus webhook signature using HMAC-SHA256.
 * Signature is in the `locus-signature` header as `t=...,v1=...`.
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = Object.fromEntries(
      signature.split(",").map((p) => p.split("=") as [string, string])
    );
    const timestamp = parts["t"];
    const v1 = parts["v1"];
    if (!timestamp || !v1) return false;

    const toSign = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(toSign));
    const computed = Buffer.from(sig).toString("hex");
    return computed === v1;
  } catch {
    return false;
  }
}
