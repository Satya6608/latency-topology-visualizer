import { NextResponse } from "next/server";
import countryData from "../../data/countryCoordinates.json";
import { LocationLatency } from "@/app/types/types";

// Fetch Cloudflare Radar current latency for specific locations
async function fetchCurrentRadarLatency(locations: string[]) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    console.warn("Missing CLOUDFLARE_API_TOKEN");
    return [];
  }

  const locationParam = locations.slice(0, 10).join(",");
  const url = `https://api.cloudflare.com/client/v4/radar/quality/iqi/timeseries_groups?metric=LATENCY&aggInterval=15m&location=${locationParam}&dateRange=1d&format=JSON`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const json = await res.json();
    if (!json.success) return [];

    const results: LocationLatency[] = [];

    for (const [key, series] of Object.entries(json.result)) {
      if (key === "serie_0") {
        const loc = key.replace("serie_0", "");
        const lastIdx = series.timestamps?.length - 1;
        const lastValue = parseFloat(series.p50[lastIdx] || "0");
        results.push({
          location: loc.toUpperCase(),
          series: [
            {
              timestamp: series.timestamps[lastIdx],
              value: lastValue,
            },
          ],
        });
      }
    }

    return results;
  } catch (err) {
    console.error("Radar API error", err);
    return [];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationsParam = searchParams.get("locations");
  if (!locationsParam) {
    return NextResponse.json({ error: "Missing locations" }, { status: 400 });
  }

  const locations = locationsParam.split(",").map((l) => l.trim());
  const now = new Date().toISOString();

  // Fetch only the latest latency per location
  const latencyData = await fetchCurrentRadarLatency(locations);
  // Enrich with country data (optional)
  const enriched = latencyData.map((entry) => {
    const coords = (countryData as any)[entry.location] || {};
    const latest = entry.series[0]?.value ?? 0;

    return {
      code: entry.location,
      country: coords.country || entry.location,
      lat: coords.lat || 0,
      lng: coords.lng || 0,
      currentLatency: parseFloat(latest.toFixed(2)),
      timestamp: now,
    };
  });

  return NextResponse.json({
    updated: now,
    count: enriched.length,
    data: enriched,
  });
}
