import { NextResponse } from "next/server";

import exchanges from "../../data/exchanges.json";

export async function GET() {
  const token = process.env.PINGDOM_API_TOKEN;

  // fallback probe data (if no token or error)
  const fallbackProbes = [
    { name: "US East", country: "US", ipv4: "23.111.159.174", ipv6: null },
    { name: "Amsterdam", country: "NL", ipv4: "94.75.211.73", ipv6: null },
    { name: "Singapore", country: "SG", ipv4: "52.197.31.124", ipv6: null },
  ];

  if (!token) {
    return NextResponse.json({
      probes: fallbackProbes,
      exchanges,
    });
  }

  try {
    const res = await fetch("https://api.pingdom.com/api/3.1/probes", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const json = await res.json();

    const probes = json.probes
      .filter((p: any) => p.active)
      .map((p: any) => ({
        name: p.name,
        country: p.country,
        ipv4: p.ipv4 ?? null,
        ipv6: p.ipv6 ?? null,
      }));

    return NextResponse.json({
      probes,
      exchanges: exchanges,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({
      probes: fallbackProbes,
      exchanges,
    });
  }
}
