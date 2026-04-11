"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Tool {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  category: string;
  tags: string[];
  coverImageUrl: string | null;
  type: string;
  price: number;
  featured: boolean;
  totalRuns: number;
  createdAt: string;
  creator: { name: string | null };
}

const CATEGORIES = [
  "All", "Productivity", "Developer Tools", "Research", "Writing", "Data", "Creative",
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

export default function BrowseClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tools, setTools] = useState<Tool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") ?? "All";
  const search = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Number(searchParams.get("page") ?? 1);

  const [searchInput, setSearchInput] = useState(search);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category && category !== "All") params.set("category", category);
    if (search) params.set("q", search);
    if (sort) params.set("sort", sort);
    params.set("page", String(page));

    const res = await fetch(`/api/tools?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTools(data.tools);
      setTotal(data.total);
    }
    setLoading(false);
  }, [category, search, sort, page]);

  useEffect(() => { fetchTools(); }, [fetchTools]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "All") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/browse?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", searchInput);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse AI Tools</h1>
        <p className="text-slate-400">
          {total} tool{total !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search tools..."
            className="flex-1 max-w-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#00C896] hover:bg-[#00b585] text-[#0c1117] font-bold text-sm transition-all shadow-lg shadow-[#00C896]/20 cursor-pointer"
          >
            Search
          </button>
        </form>

        <select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="w-auto max-w-[200px] cursor-pointer"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => updateParam("category", cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
              category === cat || (cat === "All" && !searchParams.get("category"))
                ? "bg-[#00C896] text-[#0c1117] font-bold"
                : "glass text-[#8b9ab0] hover:text-white border border-white/8 hover:border-[#00C896]/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No tools found</h3>
          <p className="text-slate-400">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="glass-card rounded-2xl overflow-hidden hover:border-[#00C896]/30 transition-all hover:-translate-y-1 group"
            >
              {tool.coverImageUrl ? (
                <div className="w-full h-40 bg-slate-800 overflow-hidden">
                  <img
                    src={tool.coverImageUrl}
                    alt={tool.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-[#00C896]/10 to-[#0040a0]/20 flex items-center justify-center text-5xl">
                  {tool.type === "RESEARCH_WORKFLOW" ? "🔬" : tool.category === "Developer Tools" ? "💻" : "⚡"}
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs border border-[#00C896]/25 bg-[#00C896]/8 px-2 py-1 rounded-full text-[#00C896]">
                    {tool.category}
                  </span>
                  <span className="text-[#00C896] font-semibold text-sm">
                    ${tool.price.toFixed(2)} USDC
                  </span>
                </div>
                <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-[#00C896] transition-colors line-clamp-1">
                  {tool.name}
                </h3>
                <p className="text-slate-400 text-sm line-clamp-2">{tool.shortDescription}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-slate-500">
                    by {tool.creator.name ?? "Creator"}
                  </span>
                  <span className="text-xs text-slate-500">{tool.totalRuns} runs</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex justify-center gap-2 mt-12">
          {page > 1 && (
            <button
              onClick={() => updateParam("page", String(page - 1))}
              className="px-4 py-2 glass rounded-lg text-sm text-slate-300 hover:text-white"
            >
              ← Previous
            </button>
          )}
          {total > page * 12 && (
            <button
              onClick={() => updateParam("page", String(page + 1))}
              className="px-4 py-2 glass rounded-lg text-sm text-slate-300 hover:text-white"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
