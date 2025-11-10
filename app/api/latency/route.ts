import { NextResponse } from "next/server";
import exchanges from "../../data/exchanges.json";
import countryData from "../../data/countryCoordinates.json";
import { LocationLatency, PingdomProbe } from "@/app/types/types";

// Haversine distance in km
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fetch Pingdom probe countries
async function fetchPingdomProbes(): Promise<string[]> {
  const token = process.env.PINGDOM_API_TOKEN;
  if (!token) return ["US", "GB", "SG", "DE", "JP"];

  try {
    const res = await fetch("https://api.pingdom.com/api/3.1/probes", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json();

    if (!json.probes) return [];
    const activeProbes = json.probes.map((p: PingdomProbe) => p.countryiso);
    return Array.from(new Set(activeProbes));
  } catch {
    return ["US", "GB", "SG"];
  }
}

// Fetch Cloudflare IQI latency
async function fetchRadarLatency(
  locations: string[]
): Promise<LocationLatency[]> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) return [];

  const locationParam = locations.slice(0, 10).join(",");
  const url = `https://api.cloudflare.com/client/v4/radar/quality/iqi/timeseries_groups?metric=LATENCY&aggInterval=1h&location=${locationParam}&dateRange=1d&format=JSON`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json();
    if (!json.success) return [];

    const serie = json.result?.serie_0;
    if (!serie || !serie.p50) return [];

    return [
      {
        location: "Global",
        series: serie.timestamps.map((t: string, i: number) => ({
          timestamp: t,
          value: parseFloat(serie.p50[i] || "0"),
        })),
      },
    ];
  } catch {
    return [];
  }
}

export async function GET() {
  const now = new Date().toISOString();
  const locations = await fetchPingdomProbes();
  const radarLatencyData = await fetchRadarLatency(locations);

  const enriched = locations.map((code) => {
    const coords = (countryData as any)[code] || {};
    const latencySeries = radarLatencyData[0]?.series || [];
    const latest = latencySeries[latencySeries.length - 1]?.value || 0;
    const avg =
      latencySeries.reduce((a, b) => a + b.value, 0) /
      (latencySeries.length || 1);

    // Find nearest exchange
    let nearestExchange: any = null;
    let minDistance = Infinity;

    for (const ex of exchanges as any[]) {
      const distance = haversineDistance(
        coords.lat,
        coords.lng,
        ex.lat,
        ex.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestExchange = {
          id: ex.id,
          name: ex.name,
          provider: ex.provider,
          region: ex.region,
          distanceKm: parseFloat(distance.toFixed(2)),
        };
      }
    }

    return {
      code,
      country: coords.country || code,
      lat: coords.lat || 0,
      lng: coords.lng || 0,
      currentLatency: parseFloat(latest.toFixed(2)),
      avgLatency: parseFloat(avg.toFixed(2)),
      nearestExchange,
      timestamp: now,
    };
  });

  return NextResponse.json({
    updated: now,
    probeCount: locations.length,
    data: enriched,
  });
}
