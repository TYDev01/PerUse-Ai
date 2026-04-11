/**
 * Locus Wrapped API client.
 * All AI execution routes through https://api.paywithlocus.com/api/wrapped/...
 */

const LOCUS_API_BASE =
  process.env.LOCUS_API_BASE ?? "https://api.paywithlocus.com/api";
const LOCUS_API_KEY = process.env.LOCUS_API_KEY ?? "";

async function locusWrapped(
  provider: string,
  endpoint: string,
  body: Record<string, unknown>
): Promise<{ data: unknown; cost?: number }> {
  const res = await fetch(
    `${LOCUS_API_BASE}/wrapped/${provider}/${endpoint}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOCUS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message ?? `Locus wrapped API error: ${res.status} ${provider}/${endpoint}`
    );
  }

  const json = await res.json();
  return { data: json.data, cost: json.cost };
}

/** Call OpenAI chat completions via Locus wrapped API */
export async function openAiChat(params: {
  model?: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; cost: number }> {
  const { data, cost } = await locusWrapped("openai", "chat", {
    model: params.model ?? "gpt-4o-mini",
    messages: params.messages,
    max_tokens: params.maxTokens ?? 2048,
    temperature: params.temperature ?? 0.7,
  });

  const d = data as {
    choices: { message: { content: string } }[];
  };
  return {
    text: d.choices[0]?.message?.content ?? "",
    cost: cost ?? 0,
  };
}

/** Search the web via Locus wrapped Brave Search */
export async function braveSearch(query: string, count = 5): Promise<
  { title: string; url: string; description: string }[]
> {
  const { data } = await locusWrapped("brave", "web-search", {
    q: query,
    count,
  });

  const d = data as {
    web?: { results: { title: string; url: string; description: string }[] };
  };
  return d.web?.results ?? [];
}

/** Scrape a URL via Locus wrapped Firecrawl */
export async function scrapeUrl(url: string): Promise<string> {
  const { data } = await locusWrapped("firecrawl", "scrape", {
    url,
    formats: ["markdown"],
  });

  const d = data as { markdown?: string; content?: string };
  return d.markdown ?? d.content ?? "";
}

/** Search with Exa for semantic research */
export async function exaSearch(
  query: string,
  numResults = 5
): Promise<{ title: string; url: string; text?: string }[]> {
  const { data } = await locusWrapped("exa", "search", {
    query,
    numResults,
    useAutoprompt: true,
    type: "neural",
  });

  const d = data as {
    results: { title: string; url: string; text?: string }[];
  };
  return d.results ?? [];
}
