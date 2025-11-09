// app/store/useGlobeStore.ts
import { create } from "zustand";

type GlobeState = {
  autoRotate: boolean;
  sidebarOpen: boolean;
  toggleRotate: () => void;
  toggleSidebar: () => void;
  setAutoRotate: (value: boolean) => void;
};

export const useGlobeStore = create<GlobeState>((set) => ({
  autoRotate: true,
  sidebarOpen: true,
  toggleRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setAutoRotate: (value) => set({ autoRotate: value }),
}));
