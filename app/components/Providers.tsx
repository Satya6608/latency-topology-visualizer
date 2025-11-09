"use client";

import React, { createContext, useEffect, useState } from "react";
import TopNavbar from "./TopNavbar";
import SidebarFilters from "./SidebarFilters";

export const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const saved =
      typeof window !== "undefined" && localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
        <TopNavbar onToggleSidebar={() => setIsSidebarOpen((s) => !s)} />
        <SidebarFilters
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="pt-16">{children}</main>
      </div>
    </ThemeContext.Provider>
  );
}
