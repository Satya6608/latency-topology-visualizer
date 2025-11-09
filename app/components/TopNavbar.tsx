"use client";

import Link from "next/link";
import { useContext } from "react";
import { ThemeContext } from "./Providers";
import { usePathname } from "next/navigation";

export default function TopNavbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const path = usePathname();

  const navItem = (href: string, label: string) => (
    <Link
      href={href}
      className={`px-3 py-1 rounded-md text-sm font-medium ${
        path === href
          ? "bg-gray-200 dark:bg-gray-800"
          : "hover:bg-gray-100 dark:hover:bg-gray-900"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Open filters"
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900"
            title="Filters"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M10 12h10M6 18h8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="text-lg font-semibold">🌎 Latency Topology</div>
        </div>

        <nav className="flex items-center gap-2">
          {navItem("/", "Home")}
          {navItem("/historical", "Historical")}
          {navItem("/regions", "Regions")}

          <button
            onClick={toggleTheme}
            className="ml-3 px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-sm"
            aria-label="Toggle theme"
            title="Toggle Day/Night"
          >
            {theme === "dark" ? "☀️ Day" : "🌙 Night"}
          </button>
        </nav>
      </div>
    </header>
  );
}
