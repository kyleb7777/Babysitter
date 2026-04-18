export type CalendarEvent = {
  /**
   * Stable identifier for a single occurrence. For non-recurring events this
   * matches the VEVENT's UID. For recurrences we append the occurrence's ISO
   * start time so every instance is uniquely addressable from the DB.
   */
  uid: string;
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

import { getSetting, SETTING_KEYS } from "./settings";

// Railpack scans source for `process.env.FOO` and requires matching build
// secrets — even for runtime-only vars. Bracket access with a computed key
// hides the reference from its static analyzer so builds don't fail when
// the var isn't set during build.
function readEnv(key: string): string | undefined {
  const k = key;
  return process.env[k];
}
const ICS_URL_ENV = "GOOGLE_CALENDAR_ICS_URL";

async function readIcsUrl(): Promise<string | null> {
  const fromDb = await getSetting(SETTING_KEYS.calendarIcsUrl);
  if (fromDb) return fromDb;
  return readEnv(ICS_URL_ENV) ?? null;
}

type CacheEntry = { fetchedAt: number; url: string; data: CalendarData };
const CACHE_TTL_MS = 60_000;
let cache: CacheEntry | null = null;

async function getIcsData(): Promise<CalendarData | null> {
  const url = await readIcsUrl();
  if (!url) return null;
  if (cache && cache.url === url && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }
  const ical = await loadIcal();
  const data = await ical.async.fromURL(url);
  cache = { fetchedAt: Date.now(), url, data };
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

type ExpandedOccurrence = {
  baseUid: string;
  title: string;
  location: string | null;
  allDay: boolean;
  start: Date;
  end: Date;
  isRecurring: boolean;
};

function buildOccurrenceUid(o: ExpandedOccurrence): string {
  return o.isRecurring ? `${o.baseUid}@${o.start.toISOString()}` : o.baseUid;
}

async function collectOccurrences(
  windowStart: Date,
  windowEnd: Date,
): Promise<ExpandedOccurrence[]> {
  const data = await getIcsData();
  if (!data) return [];
  const results: ExpandedOccurrence[] = [];

  for (const key of Object.keys(data)) {
    const component = data[key];
    if (!component || component.type !== "VEVENT") continue;
    const e = component as unknown as {
      uid?: string;
      start?: Date;
      end?: Date;
      summary?: unknown;
      location?: unknown;
      datetype?: string;
      rrule?: { between: (a: Date, b: Date, inc: boolean) => Date[] };
      recurrences?: Record<string, { start?: Date; end?: Date }>;
    };
    const baseStart = e.start;
    const baseEnd = e.end ?? baseStart;
    if (!baseStart || !baseEnd) continue;
    const baseUid = e.uid || `${toPlainString(e.summary) ?? "event"}@${baseStart.toISOString()}`;
    const title = toPlainString(e.summary) ?? "(untitled)";
    const location = toPlainString(e.location);
    const allDay = e.datetype === "date";

    if (e.rrule && typeof e.rrule.between === "function") {
      const between = e.rrule.between(windowStart, windowEnd, true);
      const durationMs = baseEnd.getTime() - baseStart.getTime();
      for (const instStart of between) {
        results.push({
          baseUid,
          title,
          location,
          allDay,
          start: instStart,
          end: new Date(instStart.getTime() + durationMs),
          isRecurring: true,
        });
      }
      if (e.recurrences) {
        for (const recurKey of Object.keys(e.recurrences)) {
          const override = e.recurrences[recurKey];
          const os = override?.start;
          const oe = override?.end ?? os;
          if (os && oe && os >= windowStart && os <= windowEnd) {
            results.push({
              baseUid,
              title,
              location,
              allDay,
              start: os,
              end: oe,
              isRecurring: true,
            });
          }
        }
      }
    } else if (baseEnd >= windowStart && baseStart <= windowEnd) {
      results.push({
        baseUid,
        title,
        location,
        allDay,
        start: baseStart,
        end: baseEnd,
        isRecurring: false,
      });
    }
  }

  return results;
}

function toCalendarEvent(o: ExpandedOccurrence): CalendarEvent {
  return {
    uid: buildOccurrenceUid(o),
    title: o.title,
    start: o.start.toISOString(),
    end: o.end.toISOString(),
    allDay: o.allDay,
    location: o.location,
  };
}

/**
 * All events that overlap the given local calendar date (YYYY-MM-DD).
 */
export async function getEventsForDate(dateString: string): Promise<CalendarEvent[]> {
  const [y, m, d] = dateString.split("-").map((n) => parseInt(n, 10));
  const target = { y, m: m - 1, d };
  const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

  const bufferStart = new Date(dayStart.getTime() - 7 * 86400_000);
  const bufferEnd = new Date(dayEnd.getTime() + 7 * 86400_000);
  const occurrences = await collectOccurrences(bufferStart, bufferEnd);

  const results: CalendarEvent[] = [];
  for (const o of occurrences) {
    if (o.allDay) {
      if (sameLocalDay(o.start, target)) results.push(toCalendarEvent(o));
    } else if (o.start <= dayEnd && o.end >= dayStart) {
      results.push(toCalendarEvent(o));
    }
  }
  results.sort((a, b) => a.start.localeCompare(b.start));
  return results;
}

/**
 * All events whose start falls between the two dates (inclusive).
 */
export async function getEventsInRange(
  startDate: Date,
  endDate: Date,
): Promise<CalendarEvent[]> {
  const occurrences = await collectOccurrences(startDate, endDate);
  const results: CalendarEvent[] = [];
  for (const o of occurrences) {
    if (o.start >= startDate && o.start <= endDate) {
      results.push(toCalendarEvent(o));
    }
  }
  results.sort((a, b) => a.start.localeCompare(b.start));
  return results;
}

export async function isCalendarConfigured(): Promise<boolean> {
  return Boolean(await readIcsUrl());
}
