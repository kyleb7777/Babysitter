import Link from "next/link";
import { prisma } from "@/lib/db";
import { getEventsInRange, isCalendarConfigured, type CalendarEvent } from "@/lib/calendar-feed";
import { dismissEvent, undismissEvent } from "./actions";
import { AssignSitter } from "./AssignSitter";

export const dynamic = "force-dynamic";

const DAYS_AHEAD = 30;
const TIME_ZONE = process.env.TIME_ZONE || "America/New_York";

function zonedParts(d: Date): { y: number; m: number; d: number; h: number; min: number } {
  // Extract year/month/day/hour/minute in the configured TIME_ZONE so date
  // grouping and time formatting don't fall back to the server's UTC locale.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return {
    y: parseInt(parts.year, 10),
    m: parseInt(parts.month, 10),
    d: parseInt(parts.day, 10),
    h: parseInt(parts.hour, 10),
    min: parseInt(parts.minute, 10),
  };
}

function formatDayHeader(dateString: string) {
  // dateString is YYYY-MM-DD in the configured timezone.
  const [y, m, d] = dateString.split("-").map((n) => parseInt(n, 10));
  // Anchor at noon UTC so the weekday calculation is stable regardless of TZ.
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return anchor.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTimeRange(ev: CalendarEvent) {
  if (ev.allDay) return "All day";
  const fmt: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  };
  const start = new Date(ev.start).toLocaleTimeString([], fmt);
  const end = new Date(ev.end).toLocaleTimeString([], fmt);
  return `${start} – ${end}`;
}

function toDateInput(d: Date): string {
  const p = zonedParts(d);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

function toTimeInput(d: Date): string {
  const p = zonedParts(d);
  return `${String(p.h).padStart(2, "0")}:${String(p.min).padStart(2, "0")}`;
}

function buildRequestLink(ev: CalendarEvent): string {
  const start = new Date(ev.start);
  const end = new Date(ev.end);
  const params = new URLSearchParams({
    eventUid: ev.uid,
    date: toDateInput(start),
    title: ev.title,
  });
  if (!ev.allDay) {
    params.set("startTime", toTimeInput(start));
    params.set("endTime", toTimeInput(end));
  }
  return `/requests/new?${params.toString()}`;
}

type RequestStatus = {
  id: string;
  status: string;
  filledByName: string | null;
};

export default async function CalendarPage() {
  if (!(await isCalendarConfigured())) {
    return (
      <>
        <h1 className="h1">Family calendar</h1>
        <div className="card">
          <div className="empty">
            No calendar connected yet. Go to <a href="/settings" style={{ textDecoration: "underline" }}>Settings</a>{" "}
            to paste your Google Calendar iCal URL.
          </div>
        </div>
      </>
    );
  }

  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowEnd.getDate() + DAYS_AHEAD);

  let events: CalendarEvent[] = [];
  let fetchError: string | null = null;
  try {
    events = await getEventsInRange(windowStart, windowEnd);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  const uids = events.map((e) => e.uid);
  const baseUids = Array.from(new Set(uids.map((u) => u.split("@")[0])));

  const [linkedRequests, dismissed, activeSitters] = await Promise.all([
    prisma.sitterRequest.findMany({
      where: { calendarEventUid: { in: [...uids, ...baseUids] } },
      include: { outreaches: { include: { sitter: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dismissedEvent.findMany({
      where: { eventUid: { in: [...uids, ...baseUids] } },
    }),
    prisma.sitter.findMany({
      where: { active: true },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const requestByUid = new Map<string, RequestStatus>();
  for (const r of linkedRequests) {
    if (!r.calendarEventUid) continue;
    const filledBy = r.outreaches.find((o) => o.status === "YES");
    requestByUid.set(r.calendarEventUid, {
      id: r.id,
      status: r.status,
      filledByName: filledBy?.sitter.name ?? null,
    });
  }
  const dismissedSet = new Set(dismissed.map((d) => d.eventUid));

  // Group events by local date for readable output.
  const groups = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = toDateInput(new Date(ev.start));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ev);
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 20 }}>
        <h1 className="h1" style={{ margin: 0 }}>Family calendar</h1>
        <div className="spacer" />
        <span className="muted" style={{ fontSize: 13 }}>
          next {DAYS_AHEAD} days
        </span>
      </div>

      {fetchError && (
        <div className="error">Could not load calendar: {fetchError}</div>
      )}

      {groups.size === 0 && !fetchError && (
        <div className="card">
          <div className="empty">No events on the calendar in the next {DAYS_AHEAD} days.</div>
        </div>
      )}

      {Array.from(groups.entries()).map(([dayKey, dayEvents]) => (
        <div key={dayKey} className="card">
          <h2 className="h2" style={{ marginBottom: 14 }}>
            {formatDayHeader(dayKey)}
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            {dayEvents.map((ev) => {
              const req = requestByUid.get(ev.uid);
              const isDismissed = dismissedSet.has(ev.uid);
              return (
                <div key={ev.uid} className="eventRow">
                  <div className="eventMeta">
                    <div className="eventTime">{formatTimeRange(ev)}</div>
                    <div className="eventTitle">{ev.title}</div>
                    {ev.location && (
                      <div className="muted" style={{ fontSize: 12 }}>{ev.location}</div>
                    )}
                  </div>
                  <div className="eventStatus">
                    {req?.status === "FILLED" ? (
                      <span className="badge badge-FILLED">
                        Booked{req.filledByName ? `: ${req.filledByName}` : ""}
                      </span>
                    ) : req?.status === "PENDING" ? (
                      <span className="badge badge-PENDING">Sitter requested</span>
                    ) : req?.status === "EXHAUSTED" ? (
                      <span className="badge badge-MAYBE">No sitter yet</span>
                    ) : req?.status === "CANCELLED" ? (
                      <span className="badge badge-CANCELLED">Cancelled</span>
                    ) : isDismissed ? (
                      <span className="badge">No sitter needed</span>
                    ) : (
                      <span className="muted" style={{ fontSize: 12 }}>—</span>
                    )}
                  </div>
                  <div className="eventActions">
                    {req ? (
                      <Link href={`/requests/${req.id}`} className="btn">View request</Link>
                    ) : isDismissed ? (
                      <form action={undismissEvent} style={{ display: "inline" }}>
                        <input type="hidden" name="eventUid" value={ev.uid} />
                        <button className="btn" type="submit">Undo</button>
                      </form>
                    ) : (
                      <>
                        <Link href={buildRequestLink(ev)} className="btn btnPrimary">
                          Request sitter
                        </Link>
                        <AssignSitter
                          eventUid={ev.uid}
                          date={toDateInput(new Date(ev.start))}
                          startTime={ev.allDay ? null : toTimeInput(new Date(ev.start))}
                          endTime={ev.allDay ? null : toTimeInput(new Date(ev.end))}
                          title={ev.title}
                          sitters={activeSitters}
                        />
                        <form action={dismissEvent} style={{ display: "inline" }}>
                          <input type="hidden" name="eventUid" value={ev.uid} />
                          <button className="btn" type="submit" title="Doesn't need a sitter">
                            Dismiss
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
