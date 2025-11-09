// app/store/useFilterStore.ts
import { create } from "zustand";

export type Exchange = {
  name: string;
  provider: string;
  region: string;
  selected: boolean;
};

export const useFilterStore = create((set) => ({
  exchanges: [
    {
      name: "Binance",
      provider: "AWS",
      region: "ap-southeast-1",
      selected: true,
    },
    // ...
  ],
  toggleExchange: (name: string) =>
    set((s: any) => ({
      exchanges: s.exchanges.map((e: any) =>
        e.name === name ? { ...e, selected: !e.selected } : e
      ),
    })),
}));
