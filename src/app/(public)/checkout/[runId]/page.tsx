import CheckoutClient from "./CheckoutClient";

export const metadata = { title: "Checkout — PerUse AI" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return <CheckoutClient runId={runId} />;
}
