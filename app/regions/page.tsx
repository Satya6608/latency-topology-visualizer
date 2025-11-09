// app/regions/page.tsx
"use client";

import GlobeLatency from "../components/GlobeLatency";

export default function RegionsPage() {
  return (
    <main className="p-6 min-h-[calc(100vh-4rem)]">
      <h2 className="text-xl font-semibold mb-4">Region View</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[55vh] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          <GlobeLatency />
        </div>
        <div className="h-[55vh] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          {/* Could be a list or regional map */}
          <GlobeLatency />
        </div>
      </div>
    </main>
  );
}
