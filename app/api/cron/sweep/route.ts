import { NextResponse } from "next/server";
import { sweepTimeouts } from "@/lib/outreach";

export const dynamic = "force-dynamic";

export async function POST() {
  const advanced = await sweepTimeouts();
  return NextResponse.json({ advanced });
}

export async function GET() {
  return POST();
}
