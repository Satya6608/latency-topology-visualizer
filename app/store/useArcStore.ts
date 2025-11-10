// app/store/useArcStore.ts
import { create } from "zustand";

interface Arc {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  latency: number;
  color: string;
  source: string;
  target: string;
  targetProvider: string;
  distance: number;
  sourceType: string;
  targetType: string;
  sourceLocation: string;
  targetLocation: string;
}

interface ArcStore {
  arcs: Arc[];
  filteredArcs: Arc[];

  allProviders: string[];
  allRegions: { label: string; value: string }[];
  // filters
  providers: string[];
  region: string[];
  minLatency: number | null;
  maxLatency: number | null;
  showMinMaxLatency: boolean;

  // actions
  addOrUpdateArcs: (newArcs: Arc[]) => void;
  setFilters: (filters: {
    providers?: string[];
    region?: string[];
    minLatency?: number | null;
    maxLatency?: number | null;
  }) => void;
  setAllProviders: (providers: string[]) => void;
  setAllRegions: (regions: { label: string; value: string }[]) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  setMinMaxLatencyVisibility: (show: boolean) => void;
}

export const useArcStore = create<ArcStore>((set, get) => ({
  arcs: [],
  filteredArcs: [],
  allProviders: ["AWS", "Azure", "GCP", "Equinix"],
  allRegions: [
    { label: "United States", value: "US" },
    { label: "United Kingdom", value: "GB" },
    { label: "Singapore", value: "SG" },
    { label: "Germany", value: "DE" },
    { label: "Japan", value: "JP" },
    { label: "India", value: "IN" },
    { label: "Australia", value: "AU" },
    { label: "Brazil", value: "BR" },
    { label: "France", value: "FR" },
    { label: "South Africa", value: "ZA" },
  ],
  providers: [],
  region: [],
  minLatency: null,
  maxLatency: null,
  showMinMaxLatency: false,

  addOrUpdateArcs: (newArcs) => {
    const { arcs, providers, region, minLatency, maxLatency, applyFilters } =
      get();
    const updatedArcs = [...arcs];

    newArcs.forEach((arc) => {
      const idx = updatedArcs.findIndex((a) => a.id === arc.id);
      if (idx !== -1) {
        // ✅ Update only the changing fields
        updatedArcs[idx].latency = arc.latency;
        updatedArcs[idx].color = arc.color;
        updatedArcs[idx].distance = arc.distance ?? updatedArcs[idx].distance;
      } else {
        // ✅ Push new reference only when new arc added
        updatedArcs.push(arc);
      }
    });

    // ✅ Update global arcs reference
    set({ arcs: updatedArcs });

    // Step 2: Check if filters are active
    const hasFilters =
      providers.length > 0 ||
      (region && region.length > 0) ||
      minLatency != null ||
      maxLatency != null;

    // Step 3: Update filteredArcs
    set((state) => {
      const { filteredArcs } = state;

      // 🔥 In-place updates only (preserve references)
      newArcs.forEach((arc) => {
        const idx = filteredArcs.findIndex((a) => a.id === arc.id);

        if (idx !== -1) {
          filteredArcs[idx].latency = arc.latency;
          filteredArcs[idx].color = arc.color;
        } else if (!hasFilters) {
          // Only add if not filtering (to avoid showing filtered-out arcs)
          filteredArcs.push(arc);
        }
      });

      return { filteredArcs }; // same reference, no flicker
    });

    // Step 4: If filters are active, reapply after merge
    if (hasFilters) {
      applyFilters();
    }
  },

  // 🧩 Update filter values
  setFilters: (filters) => {
    set((state) => ({
      providers: filters.providers ?? state.providers,
      region: Array.isArray(filters.region) ? filters.region : state.region,
      minLatency:
        typeof filters.minLatency === "number"
          ? filters.minLatency
          : state.minLatency,
      maxLatency:
        typeof filters.maxLatency === "number"
          ? filters.maxLatency
          : state.maxLatency,
    }));
  },

  setAllProviders: (providers) => {
    set({ allProviders: providers });
  },
  setAllRegions: (regions) => {
    set({ allRegions: regions });
  },
  // 🧮 Apply current filters
  applyFilters: () => {
    const { arcs, providers, region, minLatency, maxLatency } = get();

    let filtered = [...arcs];

    if (providers.length) {
      filtered = filtered.filter((a) => providers.includes(a.targetProvider));
    }

    if (region && region.length > 0) {
      filtered = filtered.filter((a) =>
        region.some(
          (r) =>
            a.sourceLocation?.toLowerCase().includes(r.toLowerCase()) ||
            a.targetLocation?.toLowerCase().includes(r.toLowerCase())
        )
      );
    }

    if (minLatency != null)
      filtered = filtered.filter((a) => a.latency >= minLatency);
    if (maxLatency != null)
      filtered = filtered.filter((a) => a.latency <= maxLatency);

    set({ filteredArcs: filtered });
  },

  // ♻️ Reset all filters
  resetFilters: () => {
    const { arcs } = get();
    set({
      providers: [],
      region: [],
      minLatency: null,
      maxLatency: null,
      filteredArcs: arcs,
    });
  },
  setMinMaxLatencyVisibility: (show) => {
    set({ showMinMaxLatency: show });
  }
}));
