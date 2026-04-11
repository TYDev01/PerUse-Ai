import { openAiChat, braveSearch, scrapeUrl, exaSearch } from "@/lib/locus/wrapped-api";

export interface ExecutionInput {
  type: "PROMPT_TEMPLATE" | "RESEARCH_WORKFLOW";
  provider: string;
  model: string;
  configJson: Record<string, unknown>;
  userInput: Record<string, unknown>;
}

export interface ExecutionResult {
  outputText: string;
  outputJson?: Record<string, unknown>;
  providerCost: number;
}

/** Fill a template string with user input values e.g. {{field_key}} -> value */
function fillTemplate(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    values[key] != null ? String(values[key]) : `[${key}]`
  );
}

async function executePromptTemplate(
  config: Record<string, unknown>,
  userInput: Record<string, unknown>,
  model: string
): Promise<ExecutionResult> {
  const systemPrompt = String(config.systemPrompt ?? "You are a helpful AI assistant.");
  const promptTemplate = String(config.promptTemplate ?? "{{input}}");
  const filledPrompt = fillTemplate(promptTemplate, userInput);

  const { text, cost } = await openAiChat({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: filledPrompt },
    ],
    maxTokens: Number(config.maxTokens ?? 2048),
    temperature: Number(config.temperature ?? 0.7),
  });

  return { outputText: text, providerCost: cost };
}

async function executeResearchWorkflow(
  config: Record<string, unknown>,
  userInput: Record<string, unknown>,
  model: string
): Promise<ExecutionResult> {
  const topicField = String(config.topicField ?? "topic");
  const topic = String(userInput[topicField] ?? "");
  const searchQueryTemplate = String(config.searchQueryTemplate ?? "{{topic}}");
  const searchQuery = fillTemplate(searchQueryTemplate, userInput);
  const scrapeEnabled = config.scrapeEnabled !== false;
  const summarizationPrompt = String(
    config.summarizationPrompt ??
      "Summarize the following research findings concisely and clearly:"
  );
  const outputStructure = String(
    config.outputStructureInstructions ?? "Provide a comprehensive summary."
  );

  let totalCost = 0;
  let context = "";

  // Step 1: Search
  try {
    const results = await exaSearch(searchQuery, 5);
    context += `## Search Results for: ${topic}\n\n`;
    for (const r of results) {
      context += `### ${r.title}\nURL: ${r.url}\n${r.text ?? ""}\n\n`;
    }
  } catch {
    const braveResults = await braveSearch(searchQuery, 5);
    context += `## Search Results for: ${topic}\n\n`;
    for (const r of braveResults) {
      context += `### ${r.title}\nURL: ${r.url}\n${r.description}\n\n`;
    }
  }

  // Step 2: Scrape top result if enabled
  if (scrapeEnabled && context.includes("URL: ")) {
    const urlMatch = context.match(/URL: (https?:\/\/[^\n]+)/);
    if (urlMatch) {
      try {
        const scraped = await scrapeUrl(urlMatch[1]);
        context += `\n## Full Content from Top Result:\n${scraped.slice(0, 3000)}\n`;
      } catch {
        // scrape failed, continue with search results
      }
    }
  }

  // Step 3: Summarize
  const { text, cost } = await openAiChat({
    model,
    messages: [
      {
        role: "system",
        content: `${summarizationPrompt}\n\n${outputStructure}`,
      },
      {
        role: "user",
        content: `Topic: ${topic}\n\nResearch Findings:\n${context.slice(0, 8000)}`,
      },
    ],
    maxTokens: 2048,
  });
  totalCost += cost;

  return {
    outputText: text,
    outputJson: { topic, searchQuery, sourcesCount: 5 },
    providerCost: totalCost,
  };
}

export async function executeTool(input: ExecutionInput): Promise<ExecutionResult> {
  if (input.type === "PROMPT_TEMPLATE") {
    return executePromptTemplate(input.configJson, input.userInput, input.model);
  } else if (input.type === "RESEARCH_WORKFLOW") {
    return executeResearchWorkflow(input.configJson, input.userInput, input.model);
  }
  throw new Error(`Unsupported tool type: ${input.type}`);
}
