import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import exchanges from "../../data/exchanges.json";
import countryData from "../../data/countryCoordinates.json";
import {
  CloudflareLatency,
  ExchangeServer,
  PingdomProbe,
} from "@/app/types/types";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CACHE_PATH = path.join(process.cwd(), "app", "data", "pingdomCache.json");
const HISTORY_DIR = path.join(process.cwd(), "app", "data", "history");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function getCachedPingdomProbes(): Promise<string[]> {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const cached = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
      if (cached && Array.isArray(cached.locations)) {
        console.log("✅ Using cached Pingdom probes");
        return cached.locations;
      }
    }
  } catch (err) {
    console.warn("⚠️ Failed to read Pingdom cache:", err);
  }

  const token = process.env.PINGDOM_API_TOKEN;
  if (!token) {
    console.warn("⚠️ Missing PINGDOM_API_TOKEN. Using fallback probes.");
    const fallback = ["US", "GB", "SG", "IN", "DE"];
    fs.writeFileSync(CACHE_PATH, JSON.stringify({ locations: fallback }));
    return fallback;
  }

  try {
    const res = await fetch("https://api.pingdom.com/api/3.1/probes", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json();
    const activeProbes = json.probes
      .filter((p: PingdomProbe) => p.active)
      .map((p: PingdomProbe) => p.countryiso)
      .filter(Boolean);
    const unique = Array.from(new Set(activeProbes));

    fs.writeFileSync(
      CACHE_PATH,
      JSON.stringify({ locations: unique }, null, 2)
    );
    console.log("🧠 Cached new Pingdom probe data");
    return unique;
  } catch (err) {
    console.error("🚨 Pingdom fetch failed:", err);
    return ["US", "GB", "SG", "IN", "DE"];
  }
}

async function fetchCloudflareLatency(
  location: string
): Promise<CloudflareLatency> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token)
    return {
      p25: Math.random() * 60,
      p50: Math.random() * 100,
      p75: Math.random() * 150,
    };

  const url = `https://api.cloudflare.com/client/v4/radar/quality/iqi/timeseries_groups?metric=LATENCY&aggInterval=1h&location=${location}&dateRange=1d&format=JSON`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json();

    if (!json.success || !json.result?.serie_0)
      return { p25: 0, p50: 0, p75: 0 };

    const s = json.result.serie_0;
    return {
      p25: parseFloat(s.p25?.at(-1) || "0"),
      p50: parseFloat(s.p50?.at(-1) || "0"),
      p75: parseFloat(s.p75?.at(-1) || "0"),
    };
  } catch {
    return { p25: 0, p50: 0, p75: 0 };
  }
}

export async function GET() {
  const encoder = new TextEncoder();
  ensureDir(HISTORY_DIR);

  const stream = new ReadableStream({
    async start(controller) {
      const now = new Date().toISOString();
      const dateFile = path.join(HISTORY_DIR, `${now.slice(0, 10)}.json`);
      const probes = await getCachedPingdomProbes();

      const promises = probes.map(async (code) => {
        const coords = (countryData as any)[code];
        if (!coords) return;

        const latency = await fetchCloudflareLatency(code);

        const nearest = (exchanges as ExchangeServer[])
          .map((ex) => ({
            ...ex,
            distanceKm: haversine(coords.lat, coords.lng, ex.lat, ex.lng),
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 3);

        const data = {
          location: code,
          country: coords.country,
          lat: coords.lat,
          lng: coords.lng,
          latency,
          exchanges: nearest.map((ex) => ({
            id: ex.id,
            name: ex.name,
            lat: ex.lat,
            lng: ex.lng,
            provider: ex.provider,
            distanceKm: parseFloat(ex.distanceKm.toFixed(2)),
          })),
          timestamp: new Date().toISOString(),
        };
        // fs.appendFileSync(dateFile, JSON.stringify() + "\n");
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      });

      for await (const _ of promises);
      controller.enqueue(encoder.encode("event: end\ndata: done\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
