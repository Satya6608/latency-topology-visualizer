import { NextResponse } from "next/server";
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

async function getCachedPingdomProbes(): Promise<string[]> {
  const token = process.env.PINGDOM_API_TOKEN;
  if (!token) {
    const fallback = ["US", "GB", "SG", "IN", "DE"];
    return fallback;
  }

  try {
    const res = await fetch("https://api.pingdom.com/api/3.1/probes", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const json = (await res.json()) as { probes: PingdomProbe[] };

    const activeProbes = json.probes
      .filter((p) => p.active)
      .map((p) => p.countryiso)
      .filter(Boolean);

    const unique: string[] = Array.from(new Set(activeProbes));
    return unique;
  } catch (err) {
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
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const now = new Date().toISOString();

      try {
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
            .slice(0, 8);

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

          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          } catch (err) {
            console.warn("Stream closed before enqueue:", err);
          }
        });
        for await (const _ of promises) {
        }
        controller.enqueue(encoder.encode("event: end\ndata: done\n\n"));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
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
