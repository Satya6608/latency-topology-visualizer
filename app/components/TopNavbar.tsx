"use client";

import Link from "next/link";
import { useContext, useState } from "react";
import { ThemeContext } from "./Providers";
import { usePathname } from "next/navigation";

export default function TopNavbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItem = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      onClick={() => setMenuOpen(false)}
      className={`block px-4 py-2 rounded-md text-sm font-medium ${
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
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Open filters"
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900"
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navItem("/", "Home")}
          {navItem("/historical", "Historical")}
          {navItem("/regions", "Regions")}

          {/* Day/Night Switch */}
          <button
            onClick={toggleTheme}
            className="ml-3 px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-sm flex items-center gap-2"
            aria-label="Toggle theme"
          >
            <div
              className={`relative w-10 h-5 flex items-center bg-gray-300 dark:bg-gray-700 rounded-full p-1 transition-colors duration-300`}
            >
              <div
                className={`absolute bg-white dark:bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  theme === "dark" ? "translate-x-5" : "translate-x-0"
                }`}
              ></div>
              <span className="absolute left-1 text-xs">☀️</span>
              <span className="absolute right-1 text-xs">🌙</span>
            </div>
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900"
          aria-label="Toggle navigation menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col p-2 space-y-1">
            {navItem("/", "Home")}
            {navItem("/historical", "Historical")}
            {navItem("/regions", "Regions")}
            <button
              onClick={() => {
                toggleTheme();
                setMenuOpen(false);
              }}
              className="px-4 py-2 rounded-md text-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between"
            >
              <span>Theme</span>
              <span>{theme === "dark" ? "☀️" : "🌙"}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
