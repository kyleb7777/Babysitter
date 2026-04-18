// Build a Google Calendar "add event" deep link. Tapping it on a phone
// opens Google Calendar pre-filled with the event — one tap to save.

function stripPunct(hhmm: string) {
  return hhmm.replace(/[^\d]/g, "");
}

function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? "pm" : "am";
  const hour12 = ((h + 11) % 12) + 1;
  return m ? `${hour12}:${String(m).padStart(2, "0")}${period}` : `${hour12}${period}`;
}

// Compose "6-10pm" from "18:00" and "22:00".
export function formatTimeWindow(startTime: string, endTime: string): string {
  const a = formatClock(startTime);
  const b = formatClock(endTime);
  // collapse "6pm-10pm" -> "6-10pm" when same am/pm
  const aPeriod = a.slice(-2);
  const bPeriod = b.slice(-2);
  if (aPeriod === bPeriod) {
    return `${a.slice(0, -2)}-${b}`;
  }
  return `${a}-${b}`;
}

export function googleCalendarUrl(params: {
  title: string;
  details: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  timeZone: string;  // e.g. "America/New_York"
}) {
  const { title, details, date, startTime, endTime, timeZone } = params;
  const day = date.replace(/-/g, "");
  const start = `${day}T${stripPunct(startTime).padEnd(6, "0")}`;
  const end = `${day}T${stripPunct(endTime).padEnd(6, "0")}`;
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set("dates", `${start}/${end}`);
  url.searchParams.set("details", details);
  url.searchParams.set("ctz", timeZone);
  return url.toString();
}
