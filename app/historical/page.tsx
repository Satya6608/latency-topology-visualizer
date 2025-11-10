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
import { useArcStore } from "@/app/store/useArcStore";

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
  const {
    allRegions,
    region,
    setFilters,
    setAllProviders,
    setMinMaxLatencyVisibility,
  } = useArcStore();
  const [duration, setDuration] = useState<"1h" | "1d" | "1w">("1d");
  const [seriesMap, setSeriesMap] = useState<Record<string, Point[]>>({});
  const [status, setStatus] = useState("idle");
  const esRef = useRef<EventSource | null>(null);
  const { theme } = useContext(ThemeContext);

  const locations = useMemo(
    () => (region?.length > 0 ? region : []),
    [region, allRegions]
  );

  useEffect(() => {
    setFilters({
      providers: [],
      region: allRegions.map((r) => r.value),
      minLatency: null,
      maxLatency: null,
    });
    setMinMaxLatencyVisibility(false);
    setAllProviders([]);
  }, []);
  useEffect(() => {
    if (esRef.current) esRef.current.close();

    const params = new URLSearchParams();
    params.set("duration", duration);
    params.set("locations", locations.join(","));
    const url = `/api/historical?${params.toString()}`;

    const es = new EventSource(url);
    esRef.current = es;
    setStatus("connecting");
    setSeriesMap({});

    es.onopen = () => setStatus("connected");
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === "location" && payload.series) {
          setSeriesMap((prev) => ({
            ...prev,
            [payload.location]: payload.series,
          }));
        }
      } catch (err) {
        console.error("Invalid SSE:", e.data);
      }
    };
    es.onerror = () => {
      setStatus("error");
      es.close();
    };

    return () => es.close();
  }, [duration, locations.join(",")]);

  const chartData = useMemo(() => {
    const datasets = Object.entries(seriesMap).map(([loc, pts], idx) => ({
      label: loc,
      data: pts.map((p) => ({ x: p.ts, y: p.latency })),
      borderWidth: 2,
      tension: 0.25,
      borderColor: paletteForIndex(idx),
      backgroundColor: "transparent",
      pointRadius: 0,
    }));
    return { datasets };
  }, [seriesMap]);

  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const tickColor = isDark ? "#d1d5db" : "#374151";
  const legendLabelColor = isDark ? "#e5e7eb" : "#111";
  const tooltipBg = isDark ? "rgba(15,15,15,0.9)" : "rgba(255,255,255,0.95)";
  const tooltipText = isDark ? "#f3f4f6" : "#111827";

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      scales: {
        x: {
          type: "time",
          time: {
            unit: duration === "1h" ? "minute" : "hour",
          },
          ticks: { color: tickColor, font: { size: 11 } },
          grid: { color: gridColor, drawBorder: false },
        },
        y: {
          title: {
            display: true,
            text: "Latency (ms)",
            color: tickColor,
            font: { size: 12 },
          },
          ticks: { color: tickColor },
          grid: { color: gridColor, drawBorder: false },
        },
      },
      plugins: {
        legend: {
          labels: { color: legendLabelColor, boxWidth: 12 },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipText,
          borderWidth: 1,
          borderColor: isDark ? "#222" : "#e5e7eb",
          displayColors: false,
        },
      },
    }),
    [isDark, duration]
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header + Duration Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Historical Latency</h2>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          {["1h", "1d", "1w"].map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d as any)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                duration === d
                  ? "bg-green-600 text-white"
                  : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Region Selector Summary */}
      <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-medium">Regions:</span>
        {region.length ? (
          region.map((loc, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
            >
              {loc}
            </span>
          ))
        ) : (
          <span className="italic text-gray-400">(none selected)</span>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

      {/* Chart */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4 bg-white dark:bg-black h-[400px] sm:h-[460px]">
        <Line data={chartData} options={options} />
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Status: {status} — Showing {locations.length || "no"} region
        {locations.length > 1 ? "s" : ""}
      </div>
    </div>
  );
}

/* --- Subcomponents --- */
function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string | number;
  accent: "green" | "blue" | "red" | "yellow";
}) {
  const accentMap: Record<string, string> = {
    green: "text-green-600 dark:text-green-400",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
  };
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="text-sm text-gray-500 dark:text-gray-300">{title}</div>
      <div className={`text-2xl font-bold ${accentMap[accent]}`}>{value}</div>
    </div>
  );
}

/* --- Helper Functions --- */
function computeCurrent(map: Record<string, Point[]>) {
  let latest: Point | null = null;
  for (const pts of Object.values(map)) {
    const p = pts[pts.length - 1];
    if (p && (!latest || p.ts > latest.ts)) latest = p;
  }
  return latest ? `${latest.latency.toFixed(2)} ms` : "-";
}
function computeAverage(map: Record<string, Point[]>) {
  let sum = 0,
    count = 0;
  for (const pts of Object.values(map))
    for (const p of pts) (sum += p.latency), count++;
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
