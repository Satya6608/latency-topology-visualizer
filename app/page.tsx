"use client";

import dynamic from "next/dynamic";
import GlobeLatency from "./components/GlobeLatency";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-4rem)] bg-white dark:bg-black text-black dark:text-white bg-red-500">
      <GlobeLatency />
      <div className="w-full h-[75vh] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"></div>
    </main>
  );
}
