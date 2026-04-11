import { Suspense } from "react";
import BrowseClient from "./BrowseClient";

export const metadata = { title: "Browse AI Tools — PerUse AI" };

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseLoadingSkeleton />}>
      <BrowseClient />
    </Suspense>
  );
}

function BrowseLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-white/5 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}
