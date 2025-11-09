"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { ThemeContext } from "../components/Providers";
import "chartjs-adapter-date-fns";

import { useFilterStore } from "@/app/store/useFilterStore";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Tooltip,
  Legend
);

type Point = { ts: number; latency: number };

export default function HistoricalPage() {
  const selectedExchanges = ["US"];
  const [duration, setDuration] = useState<"1h" | "24h" | "7d">("24h");
  const [seriesMap, setSeriesMap] = useState<Record<string, Point[]>>({});
  const [status, setStatus] = useState<string>("idle");
  const esRef = useRef<EventSource | null>(null);
  const { theme } = useContext(ThemeContext);

  const locations = useMemo(
    () => Array.from(new Set(selectedExchanges)).filter(Boolean),
    [selectedExchanges]
  );

  useEffect(() => {
    // Close any existing stream
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    // Build URL
    const params = new URLSearchParams();
    params.set("duration", duration);
    params.set("locations", locations.join(","));

    const url = `/api/historical?${params.toString()}`;
    setStatus("connecting");

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setStatus("connected");
    };

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === "location" && payload.series) {
          setSeriesMap((prev) => {
            const next = { ...prev };
            next[payload.location] = payload.series;
            return next;
          });
        } else if (payload.type === "info") {
          setStatus(payload.message || "info");
        } else if (payload.type === "error") {
          console.error("stream error", payload);
        } else if (payload.type === "end") {
          setStatus("done");
        }
      } catch (err) {
        console.error("Invalid SSE payload:", e.data);
      }
    };

    es.onerror = (ev) => {
      console.error("EventSource error", ev);
      setStatus("error");
      es.close();
    };

    return () => {
      es.close();
    };
  }, [duration, locations.join(",")]);

  const chartData = useMemo(() => {
    const datasets = Object.entries(seriesMap).map(([loc, pts], idx) => ({
      label: loc,
      data: pts.map((p) => ({ x: p.ts, y: p.latency })),
      borderWidth: 2,
      tension: 0.2,
      borderColor: paletteForIndex(idx),
      backgroundColor: "transparent",
      pointRadius: 0,
    }));

    return {
      datasets,
    };
  }, [seriesMap]);

  ("use client");

  const isDark = theme === "dark";

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const tickColor = isDark ? "#d1d5db" : "#374151";
  const axisTitleColor = isDark ? "#9ca3af" : "#4b5563";
  const legendLabelColor = isDark ? "#e5e7eb" : "#3e3e3eff";
  const tooltipBg = isDark ? "rgba(15,15,15,0.9)" : "rgba(255,255,255,0.95)";
  const tooltipText = isDark ? "#f3f4f6" : "#111827";
  const chartBg = isDark ? "#030303ff" : "#ffffff";

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      animation: { duration: 400 },
      responsive: true,
      maintainAspectRatio: false,
      backgroundColor: chartBg,
      scales: {
        x: {
          type: "time",
          time: {
            tooltipFormat: "PPpp",
            unit: duration === "1h" ? "minute" : "hour",
          },
          ticks: {
            color: tickColor,
            font: { size: 11 },
          },
          grid: {
            color: gridColor,
            drawBorder: false,
          },
        },
        y: {
          title: {
            display: true,
            text: "Latency (ms)",
            color: axisTitleColor,
            font: { size: 12 },
          },
          ticks: {
            color: tickColor,
            font: { size: 11 },
          },
          grid: {
            color: gridColor,
            drawBorder: false,
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: legendLabelColor,
            font: { size: 12, family: "Inter, sans-serif" },
            boxWidth: 12,
          },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipText,
          borderWidth: 1,
          borderColor: isDark ? "#222" : "#e5e7eb",
          displayColors: false,
          padding: 10,
          titleFont: { size: 13, family: "Inter, sans-serif" },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context) => {
              const y: any = context.parsed.y;
              return `Latency: ${y.toFixed(2)} ms`;
            },
          },
        },
      },
    }),
    [isDark, duration]
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Historical Latency</h2>
        <div className="flex items-center gap-2">
          <div className="bg-gray-800 rounded-md p-1 flex gap-1">
            <button
              onClick={() => setDuration("1h")}
              className={`px-3 py-1 rounded ${
                duration === "1h" ? "bg-green-600 text-white" : "text-gray-300"
              }`}
            >
              1H
            </button>
            <button
              onClick={() => setDuration("24h")}
              className={`px-3 py-1 rounded ${
                duration === "24h" ? "bg-green-600 text-white" : "text-gray-300"
              }`}
            >
              24H
            </button>
            <button
              onClick={() => setDuration("7d")}
              className={`px-3 py-1 rounded ${
                duration === "7d" ? "bg-green-600 text-white" : "text-gray-300"
              }`}
            >
              7D
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Current Latency"
          value={computeCurrent(seriesMap)}
          accent="blue"
        />
        <StatCard
          title="Average Latency"
          value={computeAverage(seriesMap)}
          accent="yellow"
        />
        <StatCard
          title="Max Latency"
          value={computeMax(seriesMap)}
          accent="red"
        />
        <StatCard
          title="Min Latency"
          value={computeMin(seriesMap)}
          accent="green"
        />
      </div>

      <div className="border border-gray-800 rounded-md p-4 h-[460px]">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-3 text-sm text-gray-400">
        Stream status: {status}. Locations: {locations.join(", ") || "(none)"}
      </div>
    </div>
  );
}

export function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string | number;
  accent?: "green" | "blue" | "red" | "yellow";
}) {
  const accentMap: Record<string, string> = {
    green: "text-green-600 dark:text-green-400",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
  };

  return (
    <div className="col-span-1 p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0e0e0e] transition-colors duration-300">
      <div className="text-sm text-gray-500 dark:text-gray-300">{title}</div>
      <div
        className={`text-2xl font-semibold ${accent ? accentMap[accent] : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function computeCurrent(map: Record<string, Point[]>) {
  let latest: Point | null = null;
  for (const pts of Object.values(map)) {
    const p = pts[pts.length - 1];
    if (!p) continue;
    if (!latest || p.ts > latest.ts) latest = p;
  }
  return latest ? `${latest.latency} ms` : "-";
}
function computeAverage(map: Record<string, Point[]>) {
  let sum = 0,
    count = 0;
  for (const pts of Object.values(map)) {
    for (const p of pts) {
      sum += p.latency;
      count++;
    }
  }
  return count ? `${Math.round(sum / count)} ms` : "-";
}
function computeMax(map: Record<string, Point[]>) {
  let mx = -Infinity;
  for (const pts of Object.values(map))
    for (const p of pts) mx = Math.max(mx, p.latency);
  return isFinite(mx) ? `${mx} ms` : "-";
}
function computeMin(map: Record<string, Point[]>) {
  let mn = Infinity;
  for (const pts of Object.values(map))
    for (const p of pts) mn = Math.min(mn, p.latency);
  return isFinite(mn) ? `${mn} ms` : "-";
}

function paletteForIndex(i: number) {
  const colors = [
    "#7CFC00",
    "#00E5FF",
    "#FFA500",
    "#FF6B6B",
    "#9B5CF6",
    "#00C853",
  ];
  return colors[i % colors.length];
}
