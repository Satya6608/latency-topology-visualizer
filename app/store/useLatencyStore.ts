import { create } from "zustand";
import { LatencyStore } from "../types/types";

export const useLatencyStore = create<LatencyStore>((set, get) => ({
  servers: [],
  exchanges: [],
  filteredServers: [],
  filters: { provider: [], exchange: [] },

  setServers: (data) => set({ servers: data, filteredServers: data }),
  setExchanges: (data) => set({ exchanges: data }),

  updateLatency: (lat, lng, latency) => {
    const { servers } = get();
    const updated = servers.map((s) =>
      Math.abs(s.lat - lat) < 0.5 && Math.abs(s.lng - lng) < 0.5
        ? { ...s, latency }
        : s
    );
    set({ servers: updated, filteredServers: updated });
  },

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  applyFilters: () => {
    const { servers, filters } = get();
    let result = [...servers];
    if (filters.provider.length > 0)
      result = result.filter((s) =>
        filters.provider.includes(s.provider || "")
      );
    set({ filteredServers: result });
  },
}));
