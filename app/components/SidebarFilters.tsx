"use client";

import { useEffect, useState } from "react";
import { useArcStore } from "../store/useArcStore";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";

export default function SidebarFilters({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    providers,
    region,
    allProviders,
    allRegions,
    minLatency,
    maxLatency,
    setFilters,
    applyFilters,
    resetFilters,
    showMinMaxLatency,
  } = useArcStore();

  const [localProviders, setLocalProviders] = useState<string[]>([]);
  const [localRegion, setLocalRegion] = useState<string[]>([]);
  const [min, setMin] = useState<number | null>(null);
  const [max, setMax] = useState<number | null>(null);

  useEffect(() => {
    setLocalProviders(providers ?? []);
    setLocalRegion(region ?? []);
    setMin(minLatency != null ? Number(minLatency) : null);
    setMax(maxLatency != null ? Number(maxLatency) : null);
  }, [open]);

  function apply() {
    setFilters({
      providers: localProviders,
      region: localRegion,
      minLatency: min ? Number(min) : null,
      maxLatency: max ? Number(max) : null,
    });
    applyFilters();
    onClose();
  }

  function clear() {
    setLocalProviders([]);
    setLocalRegion([]);
    setMin(0);
    setMax(0);
    resetFilters();
    onClose();
  }
  const toggleRegion = (value: string) => {
    setLocalRegion((prev: any) =>
      prev.includes(value)
        ? prev.filter((v: any) => v !== value)
        : [...prev, value]
    );
  };
  const toggleProvider = (value: string) => {
    setLocalProviders((prev: any) =>
      prev.includes(value)
        ? prev.filter((v: any) => v !== value)
        : [...prev, value]
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 w-80 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Filters</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-600 hover:text-black"
            >
              ✕
            </button>
          </div>

          <div className="space-y-5 overflow-auto flex-1">
            {/* Providers */}
            {allProviders.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Cloud Providers
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Select Regions
                  </Label>
                </div>
                <div className="flex flex-col gap-2">
                  {allProviders.map((p: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center space-x-2 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Checkbox
                        id={p}
                        checked={localProviders.includes(p)}
                        onCheckedChange={() => toggleProvider(p)}
                      />
                      <Label
                        htmlFor={p}
                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        {p}
                      </Label>
                    </div>
                  ))}
                </div>
                {localProviders.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {localProviders.join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Region */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Region
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Select Regions
                </Label>

                <div className="flex flex-col gap-2">
                  {allRegions.map((r) => (
                    <div
                      key={r.value}
                      className="flex items-center space-x-2 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Checkbox
                        id={r.value}
                        checked={localRegion.includes(r.value)}
                        onCheckedChange={() => toggleRegion(r.value)}
                      />
                      <Label
                        htmlFor={r.value}
                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        {r.label}
                      </Label>
                    </div>
                  ))}
                </div>

                {localRegion.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {localRegion.join(", ")}
                  </p>
                )}
              </div>
            </div>
            {showMinMaxLatency && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Latency Range (ms)
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Latency Range (ms)
                  </Label>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={min ?? ""}
                      onChange={(e) =>
                        setMin(
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      className="w-1/2"
                    />

                    <Input
                      placeholder="Max"
                      type="number"
                      value={max ?? ""}
                      onChange={(e) =>
                        setMax(
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      className="w-1/2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={apply}
              className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Apply
            </button>
            <button
              onClick={clear}
              className="flex-1 py-2 rounded border dark:border-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
