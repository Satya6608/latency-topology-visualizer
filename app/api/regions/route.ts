import { NextResponse } from "next/server";
import regions from "../../data/cloudRegions.json";

export async function GET() {
  return NextResponse.json(regions);
}
