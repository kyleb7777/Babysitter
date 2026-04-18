export type CalendarEvent = {
  title: string;
  start: string; // ISO
  end: string;   // ISO
  allDay: boolean;
  location: string | null;
};

// node-ical's top-level init explodes during Next.js's build-time page
// data collection, so we load it lazily the first time it's actually needed.
type IcalModule = typeof import("node-ical");
type CalendarData = Awaited<ReturnType<IcalModule["async"]["fromURL"]>>;
let icalPromise: Promise<IcalModule> | null = null;
function loadIcal(): Promise<IcalModule> {
  if (!icalPromise) icalPromise = import("node-ical");
  return icalPromise;
}

type CacheEntry = { fetchedAt: number; data: CalendarData };
const CACHE_TTL_MS = 60_000;
let cache: CacheEntry | null = null;

async function getIcsData(): Promise<CalendarData | null> {
  const url = process.env.GOOGLE_CALENDAR_ICS_URL;
  if (!url) return null;
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data;
  const ical = await loadIcal();
  const data = await ical.async.fromURL(url);
  cache = { fetchedAt: Date.now(), data };
  return data;
}

function toPlainString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v && "val" in v) {
    const val = (v as { val: unknown }).val;
    return typeof val === "string" ? val : null;
  }
  return null;
}

function sameLocalDay(d: Date, target: { y: number; m: number; d: number }) {
  return (
    d.getFullYear() === target.y &&
    d.getMonth() === target.m &&
    d.getDate() === target.d
  );
}

/**
 * Return all events that overlap the given local calendar date (YYYY-MM-DD).
 * Expands weekly/monthly recurring events within a ±7-day window.
 */
export async function getEventsForDate(dateString: string): Promise<CalendarEvent[]> {
  const data = await getIcsData();
  if (!data) return [];
  const [y, m, d] = dateString.split("-").map((n) => parseInt(n, 10));
  const target = { y, m: m - 1, d };
  const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

  const results: CalendarEvent[] = [];
  for (const key of Object.keys(data)) {
    const component = data[key];
    if (!component || component.type !== "VEVENT") continue;
    const e = component as unknown as {
      start?: Date;
      end?: Date;
      summary?: unknown;
      location?: unknown;
    };
    const baseStart = e.start as Date | undefined;
    const baseEnd = (e.end as Date | undefined) ?? baseStart;
    if (!baseStart || !baseEnd) continue;

    const title = toPlainString(e.summary) ?? "(untitled)";
    const location = toPlainString(e.location);
    const datetype = (e as unknown as { datetype?: string }).datetype;
    const allDay = datetype === "date";

    const occurrences: { start: Date; end: Date }[] = [];
    const rrule = (e as unknown as { rrule?: { between: (a: Date, b: Date, inc: boolean) => Date[] } }).rrule;
    if (rrule && typeof rrule.between === "function") {
      const rangeStart = new Date(dayStart.getTime() - 7 * 86400_000);
      const rangeEnd = new Date(dayEnd.getTime() + 7 * 86400_000);
      const between = rrule.between(rangeStart, rangeEnd, true);
      const originalMs = baseEnd.getTime() - baseStart.getTime();
      for (const instStart of between) {
        occurrences.push({
          start: instStart,
          end: new Date(instStart.getTime() + originalMs),
        });
      }
      const recurrences = (e as unknown as { recurrences?: Record<string, { start?: Date; end?: Date }> }).recurrences;
      if (recurrences) {
        for (const recurKey of Object.keys(recurrences)) {
          const override = recurrences[recurKey];
          const os = override?.start as Date | undefined;
          const oe = (override?.end as Date | undefined) ?? os;
          if (os && oe) occurrences.push({ start: os, end: oe });
        }
      }
    } else {
      occurrences.push({ start: baseStart, end: baseEnd });
    }

    for (const { start, end } of occurrences) {
      if (allDay) {
        if (sameLocalDay(start, target)) {
          results.push({
            title,
            start: start.toISOString(),
            end: end.toISOString(),
            allDay: true,
            location,
          });
        }
      } else if (start <= dayEnd && end >= dayStart) {
        results.push({
          title,
          start: start.toISOString(),
          end: end.toISOString(),
          allDay: false,
          location,
        });
      }
    }
  }

  results.sort((a, b) => a.start.localeCompare(b.start));
  return results;
}

export function isCalendarConfigured() {
  return Boolean(process.env.GOOGLE_CALENDAR_ICS_URL);
}
