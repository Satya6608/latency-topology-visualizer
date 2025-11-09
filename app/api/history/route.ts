import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const HISTORY_DIR = path.join(process.cwd(), "app", "data", "history");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "24h";

  if (!fs.existsSync(HISTORY_DIR)) {
    return NextResponse.json({ success: false, data: [] });
  }

  const files = fs.readdirSync(HISTORY_DIR).filter((f) => f.endsWith(".json"));
  const now = Date.now();

  const data: any[] = [];

  for (const file of files) {
    const fullPath = path.join(HISTORY_DIR, file);
    const lines = fs
      .readFileSync(fullPath, "utf-8")
      .split("\n")
      .filter(Boolean);

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const diff = now - new Date(entry.timestamp).getTime();
        if (
          (range === "1h" && diff <= 3600 * 1000) ||
          (range === "24h" && diff <= 24 * 3600 * 1000) ||
          (range === "7d" && diff <= 7 * 24 * 3600 * 1000) ||
          (range === "30d" && diff <= 30 * 24 * 3600 * 1000)
        ) {
          data.push(entry);
        }
      } catch {}
    }
  }

  return NextResponse.json({
    success: true,
    count: data.length,
    range,
    data,
  });
}
