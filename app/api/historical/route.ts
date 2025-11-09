// app/api/historical/route.ts
import type { NextRequest } from "next/server";

// NOTE: This file runs in the server runtime. If you need Edge, add `export const runtime = "edge";`
// Example request: GET /api/historical?duration=24h&locations=ap-southeast-1,us-west1

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const duration = url.searchParams.get("duration") || "24h";
  const locationsParam = url.searchParams.get("locations") || "";
  const locations = locationsParam
    ? locationsParam.split(",").map((s) => s.trim())
    : [];

  // Cloudflare API config (set these in your .env)
  const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
  const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";

  // Helper: fetch data for a single location (replace stub with real CF API call)
  async function fetchCloudLatencyForLocation(location: string) {
    // IMPORTANT: Replace this stub with the real Cloudflare Analytics / Metrics fetch
    // Example skeleton (you must adapt to the exact CF API endpoint/params)
    if (CLOUDFLARE_API_TOKEN && CLOUDFLARE_ACCOUNT_ID) {
      // Example placeholder:
      // const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/some/latency/endpoint?location=${location}&duration=${duration}`, {
      //    headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" }
      // });
      // const json = await resp.json();
      // return transformCloudflareResponseToSeries(json);
      // For now we fall back to simulated data below.
    }

    // Simulate time series for the requested duration
    // duration -> number of points (approx)
    const points = duration === "1h" ? 60 : duration === "24h" ? 240 : 480;
    const now = Date.now();
    const intervalMs =
      duration === "1h" ? 60_000 : duration === "24h" ? 6_00000 : 180_000; // approx spacing
    const data = new Array(points).fill(0).map((_, i) => {
      const timestamp = now - (points - i - 1) * intervalMs;
      // simulate latency around 60-80ms with some variance per location
      const base = 60 + (location.length % 10);
      const jitter = Math.round((Math.random() - 0.5) * 18);
      return { ts: timestamp, latency: Math.max(1, base + jitter) };
    });
    return { location, series: data };
  }

  // Create a ReadableStream and send server-sent events (SSE)
  const stream = new ReadableStream({
    async start(controller) {
      function sendSSE(obj: any) {
        const payload = `data: ${JSON.stringify(obj)}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
      }

      // If no locations provided, immediately send a "noop" event and close
      if (locations.length === 0) {
        sendSSE({ type: "info", message: "No locations provided", duration });
        controller.close();
        return;
      }

      // Fetch each location concurrently; as each finishes, stream it
      const fetchPromises = locations.map(async (loc) => {
        try {
          const data = await fetchCloudLatencyForLocation(loc);
          // send the series as an SSE message
          sendSSE({
            type: "location",
            location: data.location,
            duration,
            series: data.series,
          });
        } catch (err) {
          sendSSE({
            type: "error",
            location: loc,
            message: (err as Error).message || "fetch error",
          });
        }
      });

      // When all fetches complete, send a final 'end' event and close
      try {
        await Promise.all(fetchPromises);
        sendSSE({ type: "end", message: "done" });
      } catch (err) {
        sendSSE({ type: "error", message: "some fetches failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
