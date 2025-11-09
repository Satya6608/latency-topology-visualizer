"use client";

import { useEffect, useState } from "react";
import { useFilterStore } from "../store/useFilterStore";

export default function SidebarFilters({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const providers = ["AWS", "Azure", "GCP", "Pingdom", "Fastly"];
  const regions = ["Americas", "EMEA", "APAC"];

  const store: any = useFilterStore();
  const [localProviders, setLocalProviders] = useState<string[]>(
    store.providers
  );
  const [localRegion, setLocalRegion] = useState<string | null>(store.region);
  const [minLatency, setMinLatency] = useState<string>(
    store.minLatency?.toString() ?? ""
  );
  const [maxLatency, setMaxLatency] = useState<string>(
    store.maxLatency?.toString() ?? ""
  );

  useEffect(() => {
    setLocalProviders(store.providers);
    setLocalRegion(store.region);
    setMinLatency(store.minLatency?.toString() ?? "");
    setMaxLatency(store.maxLatency?.toString() ?? "");
  }, [open]);

  function toggleProvider(p: string) {
    setLocalProviders((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function applyFilters() {
    store.setProviders(localProviders);
    store.setRegion(localRegion);
    store.setLatencyRange(
      minLatency ? Number(minLatency) : null,
      maxLatency ? Number(maxLatency) : null
    );
    onClose();
  }

  function clearFilters() {
    setLocalProviders([]);
    setLocalRegion(null);
    setMinLatency("");
    setMaxLatency("");
    store.reset();
    onClose();
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 w-80 max-w-full h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filters</h3>
            <button onClick={onClose} className="p-1">
              ✕
            </button>
          </div>

          <div className="space-y-4 overflow-auto">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">
                Providers
              </div>
              <div className="flex flex-col gap-2">
                {providers.map((p) => (
                  <label key={p} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localProviders?.includes(p)}
                      onChange={() => toggleProvider(p)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">
                Region
              </div>
              <select
                value={localRegion ?? ""}
                onChange={(e) => setLocalRegion(e.target.value || null)}
                className="w-full p-2 rounded border"
              >
                <option value="">All regions</option>
                {regions.map((r) => (
                  <option value={r} key={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">
                Latency range (ms)
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="min"
                  value={minLatency}
                  onChange={(e) => setMinLatency(e.target.value)}
                  className="w-1/2 p-2 rounded border"
                  type="number"
                />
                <input
                  placeholder="max"
                  value={maxLatency}
                  onChange={(e) => setMaxLatency(e.target.value)}
                  className="w-1/2 p-2 rounded border"
                  type="number"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto flex gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 py-2 rounded bg-blue-600 text-white"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="flex-1 py-2 rounded border"
            >
              Clear
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
