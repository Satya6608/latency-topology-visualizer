import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const duration = url.searchParams.get("duration") || "24h";
  const locationsParam = url.searchParams.get("locations") || "";
  const locations = locationsParam
    ? locationsParam.split(",").map((s) => s.trim())
    : [];

  const token = process.env.CLOUDFLARE_API_TOKEN || "";

  async function fetchCloudLatencyForLocation(location: string) {
    if (token) {
      const url = `https://api.cloudflare.com/client/v4/radar/quality/iqi/timeseries_groups?metric=LATENCY&aggInterval=${duration}&location=${location}&dateRange=1w&format=JSON`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await resp.json();
      return transformCloudflareResponseToSeries(json, location);
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      function sendSSE(obj: any) {
        const payload = `data: ${JSON.stringify(obj)}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
      }

      if (locations.length === 0) {
        sendSSE({ type: "info", message: "No locations provided", duration });
        controller.close();
        return;
      }
      const fetchPromises = locations.map(async (loc) => {
        try {
          const data: any = await fetchCloudLatencyForLocation(loc);
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
function transformCloudflareResponseToSeries(
  json: any,
  location: string
): {
  location: string;
  series: { ts: number; latency: number }[];
} {
  if (!json.success)
    return {
      location: location,
      series: [{ ts: 0, latency: 0 }],
    };

  let points: {
    ts: number;
    latency: number;
  }[] = [];
  points = json.result.serie_0.timestamps.map((t: number, i: number) => ({
    ts: t,
    latency: parseFloat(json.result.serie_0.p50[i] || "0"),
  }));
  return {
    location: location,
    series: points || [],
  };
}
