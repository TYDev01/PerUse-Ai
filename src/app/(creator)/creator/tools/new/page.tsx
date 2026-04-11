"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Select from "@/components/ui/Select";

type InputField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "number";
  required: boolean;
  placeholder: string;
};

const CATEGORIES = ["Writing", "Code", "Research", "Data", "Image", "Video", "Audio", "Business", "Other"];

const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229", "claude-3-sonnet-20240229"],
  google: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro", "gemini-1.5-flash"],
  mistral: ["mistral-large-latest", "mistral-small-latest", "codestral-latest"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
};

const PROVIDERS = Object.keys(PROVIDER_MODELS);

const DEFAULT_PROMPT_CONFIG = JSON.stringify(
  { systemPrompt: "You are a helpful assistant.", temperature: 0.7 },
  null,
  2
);
const DEFAULT_RESEARCH_CONFIG = JSON.stringify(
  { systemPrompt: "Summarize the research findings.", searchCount: 5, scrapeTop: 2 },
  null,
  2
);

export default function NewToolPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Metadata
  const [meta, setMeta] = useState({
    name: "",
    slug: "",
    description: "",
    category: "Other",
    tags: "",
    coverImage: "",
  });

  // Step 2: Type + Pricing
  const [pricing, setPricing] = useState({
    toolType: "PROMPT_TEMPLATE" as "PROMPT_TEMPLATE" | "RESEARCH_WORKFLOW",
    salePrice: "",
    providerCost: "",
  });

  // Step 3: Input fields
  const [fields, setFields] = useState<InputField[]>([
    { key: "", label: "", type: "text", required: true, placeholder: "" },
  ]);

  // Step 4: Execution config
  const [exec, setExec] = useState({
    provider: "openai",
    model: "gpt-4o-mini",
    configJson: DEFAULT_PROMPT_CONFIG,
  });

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  function addField() {
    setFields((f) => [...f, { key: "", label: "", type: "text", required: true, placeholder: "" }]);
  }

  function removeField(i: number) {
    setFields((f) => f.filter((_, idx) => idx !== i));
  }

  function updateField(i: number, k: keyof InputField, v: string | boolean) {
    setFields((f) => f.map((field, idx) => (idx === i ? { ...field, [k]: v } : field)));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    let configJson: Record<string, unknown>;
    try {
      configJson = JSON.parse(exec.configJson);
    } catch {
      setError("Execution config is not valid JSON");
      setLoading(false);
      return;
    }

    const body = {
      name: meta.name,
      slug: meta.slug || autoSlug(meta.name),
      shortDescription: meta.description.slice(0, 200),
      fullDescription: meta.description,
      category: meta.category,
      tags: meta.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      coverImageUrl: meta.coverImage || undefined,
      type: pricing.toolType,
      price: parseFloat(pricing.salePrice),
      inputFields: fields
        .filter((f) => f.key && f.label)
        .map((f, idx) => ({
          key: f.key,
          label: f.label,
          type: f.type.toUpperCase() as "TEXT" | "TEXTAREA" | "URL" | "SELECT",
          required: f.required,
          placeholder: f.placeholder,
          sortOrder: idx,
        })),
      executionConfig: {
        provider: exec.provider,
        model: exec.model,
        configJson,
      },
    };

    const res = await fetch("/api/creator/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      const err = data.error;
      if (err && typeof err === "object") {
        // Zod flatten() shape: { formErrors: string[], fieldErrors: Record<string, string[]> }
        const msgs: string[] = [
          ...(err.formErrors ?? []),
          ...Object.values(err.fieldErrors ?? {}).flat(),
        ];
        setError(msgs.length ? msgs.join("; ") : "Validation failed");
      } else {
        setError(err ?? "Failed to create tool");
      }
      setLoading(false);
      return;
    }

    router.push("/creator/dashboard");
  }

  const STEPS = ["Metadata", "Pricing & Type", "Input Fields", "Execution Config"];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Create New Tool</h1>
      <p className="text-slate-400 mb-8">Publish an AI tool to the PerUseAI marketplace</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === i + 1
                  ? "bg-[#00C896] text-white"
                  : step > i + 1
                  ? "bg-green-600 text-white"
                  : "glass text-slate-400"
              }`}
            >
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${step === i + 1 ? "text-white font-medium" : "text-slate-500"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/10 w-6 mx-1" />}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-8">
        {/* Step 1: Metadata */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Tool Metadata</h2>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Tool Name *</label>
              <input
                value={meta.name}
                onChange={(e) => {
                  setMeta((m) => ({ ...m, name: e.target.value, slug: autoSlug(e.target.value) }));
                }}
                placeholder="e.g. Blog Post Writer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">URL Slug *</label>
              <input
                value={meta.slug}
                onChange={(e) => setMeta((m) => ({ ...m, slug: e.target.value }))}
                placeholder="blog-post-writer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Description *</label>
              <textarea
                value={meta.description}
                onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
                placeholder="Describe what this tool does..."
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Category</label>
              <Select
                value={meta.category}
                onChange={(v) => setMeta((m) => ({ ...m, category: v }))}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Tags (comma-separated)</label>
              <input
                value={meta.tags}
                onChange={(e) => setMeta((m) => ({ ...m, tags: e.target.value }))}
                placeholder="writing, ai, blog"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Cover Image URL (optional)</label>
              <input
                value={meta.coverImage}
                onChange={(e) => setMeta((m) => ({ ...m, coverImage: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                type="url"
              />
            </div>
          </div>
        )}

        {/* Step 2: Pricing + Type */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Pricing & Tool Type</h2>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-3">Tool Type</label>
              <div className="flex gap-3">
                {(["PROMPT_TEMPLATE", "RESEARCH_WORKFLOW"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setPricing((p) => ({ ...p, toolType: t }));
                      setExec((e) => ({
                        ...e,
                        configJson: t === "PROMPT_TEMPLATE" ? DEFAULT_PROMPT_CONFIG : DEFAULT_RESEARCH_CONFIG,
                      }));
                    }}
                    className={`flex-1 p-4 rounded-xl text-sm text-left transition-all border ${
                      pricing.toolType === t
                        ? "border-[#00C896] bg-[#00C896]/10 text-white"
                        : "border-white/10 glass text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <div className="font-semibold mb-1">
                      {t === "PROMPT_TEMPLATE" ? "🧩 Prompt Template" : "🔬 Research Workflow"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t === "PROMPT_TEMPLATE"
                        ? "Fill a prompt with user inputs, run through OpenAI"
                        : "Search the web, scrape pages, then summarize with AI"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Sale Price (USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0.05"
                value={pricing.salePrice}
                onChange={(e) => setPricing((p) => ({ ...p, salePrice: e.target.value }))}
                placeholder="0.50"
                required
              />
              <p className="text-xs text-slate-500 mt-1">What users pay per run</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Provider Cost (USD) *</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={pricing.providerCost}
                onChange={(e) => setPricing((p) => ({ ...p, providerCost: e.target.value }))}
                placeholder="0.05"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Estimated API cost per run (for revenue split)</p>
            </div>
            {pricing.salePrice && pricing.providerCost && (
              <div className="p-4 rounded-xl bg-white/5 text-sm space-y-1">
                <div className="text-slate-300 font-medium mb-2">Revenue Preview</div>
                {(() => {
                  const sale = parseFloat(pricing.salePrice) || 0;
                  const cost = parseFloat(pricing.providerCost) || 0;
                  const platformFee = Math.max(sale * 0.2, 0.1);
                  const creator = sale - cost - platformFee;
                  return (
                    <>
                      <div className="flex justify-between text-slate-400"><span>Sale price</span><span>${sale.toFixed(2)}</span></div>
                      <div className="flex justify-between text-slate-400"><span>Provider cost</span><span>-${cost.toFixed(3)}</span></div>
                      <div className="flex justify-between text-slate-400"><span>Platform fee (20%, min $0.10)</span><span>-${platformFee.toFixed(3)}</span></div>
                      <div className="flex justify-between text-white font-semibold border-t border-white/10 pt-2 mt-2"><span>You earn</span><span>${Math.max(creator, 0).toFixed(3)}</span></div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Input fields */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Input Fields</h2>
              <button
                type="button"
                onClick={addField}
                className="text-sm text-[#00C896] hover:text-[#00C896] font-medium"
              >
                + Add Field
              </button>
            </div>
            <p className="text-sm text-slate-400">
              Define the form fields users fill in. Use{" "}
              <code className="bg-white/10 px-1 rounded text-[#00C896]">{"{{field_key}}"}</code> in your
              prompt template.
            </p>
            {fields.map((field, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Field {i + 1}</span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(i)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Key (no spaces)</label>
                    <input
                      value={field.key}
                      onChange={(e) => updateField(i, "key", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                      placeholder="topic"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Label</label>
                    <input
                      value={field.label}
                      onChange={(e) => updateField(i, "label", e.target.value)}
                      placeholder="Topic"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Type</label>
                    <Select
                      value={field.type}
                      onChange={(v) => updateField(i, "type", v)}
                      options={[
                        { value: "text", label: "Text" },
                        { value: "textarea", label: "Textarea" },
                        { value: "url", label: "URL" },
                        { value: "select", label: "Select" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Placeholder</label>
                    <input
                      value={field.placeholder}
                      onChange={(e) => updateField(i, "placeholder", e.target.value)}
                      placeholder="e.g. Machine learning"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(i, "required", e.target.checked)}
                    className="rounded"
                  />
                  Required field
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Execution config */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Execution Config</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">Provider</label>
                <Select
                  value={exec.provider}
                  onChange={(v) => {
                    const firstModel = PROVIDER_MODELS[v]?.[0] ?? "";
                    setExec((ex) => ({ ...ex, provider: v, model: firstModel }));
                  }}
                  options={PROVIDERS.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">Model</label>
                <Select
                  value={exec.model}
                  onChange={(v) => setExec((ex) => ({ ...ex, model: v }))}
                  options={(PROVIDER_MODELS[exec.provider] ?? []).map((m) => ({ value: m, label: m }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Config JSON</label>
              <textarea
                value={exec.configJson}
                onChange={(e) => setExec((ex) => ({ ...ex, configJson: e.target.value }))}
                rows={12}
                className="font-mono text-xs"
              />
              <p className="text-xs text-slate-500 mt-1">
                {pricing.toolType === "PROMPT_TEMPLATE"
                  ? "Include systemPrompt (use {{field_key}} placeholders) and temperature."
                  : "Include systemPrompt, searchCount (# search results), scrapeTop (# pages to scrape)."}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="px-4 py-2 rounded-xl glass text-slate-300 hover:text-white text-sm font-medium disabled:opacity-30 transition-all"
          >
            Back
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 rounded-xl bg-[#00C896] hover:bg-[#00b585] text-white text-sm font-semibold transition-all"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-[#00C896] hover:bg-[#00b585] disabled:opacity-50 text-white text-sm font-semibold transition-all"
            >
              {loading ? "Publishing..." : "Publish Tool"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
