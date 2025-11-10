"use client";

import dynamic from "next/dynamic";
import GlobeLatency from "./components/GlobeLatency";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center w-full max-h-[calc(100vh-8rem)] bg-white dark:bg-black text-black dark:text-white bg-red-500">
      <GlobeLatency />
    </main>
  );
}
