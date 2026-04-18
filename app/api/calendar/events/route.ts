import { NextRequest, NextResponse } from "next/server";
import { getEventsForDate, isCalendarConfigured } from "@/lib/calendar-feed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isCalendarConfigured())) {
    return NextResponse.json({ configured: false, events: [] });
  }
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Missing or invalid date" }, { status: 400 });
  }
  try {
    const events = await getEventsForDate(date);
    return NextResponse.json({ configured: true, events });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ configured: true, events: [], error: msg }, { status: 500 });
  }
}
