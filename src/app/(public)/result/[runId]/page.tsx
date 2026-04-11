import ResultClient from "./ResultClient";

export const metadata = { title: "Result — PerUse AI" };

export default async function ResultPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return <ResultClient runId={runId} />;
}
