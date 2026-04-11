"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

interface InputField {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  helperText: string | null;
  options: string[];
}

interface Tool {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  tags: string[];
  coverImageUrl: string | null;
  type: string;
  price: number;
  totalRuns: number;
  inputFields: InputField[];
  executionConfig: { provider: string; model: string } | null;
  creator: { name: string | null };
}

export default function ToolDetailClient({ tool }: { tool: Tool }) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate required fields
    for (const field of tool.inputFields) {
      if (field.required && !formData[field.key]?.trim()) {
        setError(`"${field.label}" is required.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const sessionId = nanoid();
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: tool.id,
          inputJson: formData,
          sessionId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to start run");
      }

      const data = await res.json();
      router.push(`/checkout/${data.runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const typeLabel =
    tool.type === "RESEARCH_WORKFLOW" ? "Research Workflow" : "Prompt Template";
  const typeIcon = tool.type === "RESEARCH_WORKFLOW" ? "🔬" : "⚡";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: Tool Info */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero image */}
          {tool.coverImageUrl ? (
            <div className="w-full h-56 rounded-2xl overflow-hidden">
              <img
                src={tool.coverImageUrl}
                alt={tool.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-56 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-violet-900/40 flex items-center justify-center text-7xl border border-white/8">
              {tool.category === "Developer Tools" ? "💻" : tool.type === "RESEARCH_WORKFLOW" ? "🔬" : "⚡"}
            </div>
          )}

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            <span className="glass px-3 py-1 rounded-full text-sm text-[#00C896]">
              {tool.category}
            </span>
            <span className="glass px-3 py-1 rounded-full text-sm text-violet-300">
              {typeIcon} {typeLabel}
            </span>
            {tool.tags.map((tag) => (
              <span key={tag} className="glass px-3 py-1 rounded-full text-xs text-slate-400">
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="text-4xl font-bold text-white">{tool.name}</h1>
          <p className="text-slate-400 text-lg leading-relaxed">{tool.shortDescription}</p>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-3">About this tool</h2>
            <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
              {tool.fullDescription}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Price per run", value: `$${tool.price.toFixed(2)} USDC` },
              { label: "Total runs", value: tool.totalRuns.toLocaleString() },
              { label: "By", value: tool.creator.name ?? "Creator" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-4 text-center">
                <div className="text-white font-semibold">{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Run Form */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Run this tool</h2>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#00C896]">
                  ${tool.price.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400">USDC per run</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {tool.inputFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-slate-200 mb-1.5">
                    {field.label}
                    {field.required && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </label>

                  {field.type === "TEXTAREA" ? (
                    <textarea
                      rows={5}
                      placeholder={field.placeholder ?? ""}
                      value={formData[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="resize-none"
                    />
                  ) : field.type === "SELECT" ? (
                    <select
                      value={formData[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    >
                      <option value="">Select an option...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "URL" ? "url" : "text"}
                      placeholder={field.placeholder ?? ""}
                      value={formData[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  )}

                  {field.helperText && (
                    <p className="text-xs text-slate-500 mt-1">{field.helperText}</p>
                  )}
                </div>
              ))}

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-[#00C896] hover:bg-[#00b585] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg transition-all glow-primary hover:scale-[1.02] active:scale-[0.98]"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating run...
                  </span>
                ) : (
                  `Run for $${tool.price.toFixed(2)} USDC`
                )}
              </button>

              <p className="text-center text-xs text-slate-500">
                Payment via Locus · USDC on Base
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
