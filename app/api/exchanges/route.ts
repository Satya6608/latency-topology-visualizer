import { NextResponse } from "next/server";
import exchanges from "../../data/exchanges.json";

export async function GET() {
  return NextResponse.json(exchanges);
}
