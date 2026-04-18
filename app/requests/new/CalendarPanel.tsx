"use client";

import { useEffect, useState } from "react";

type Event = {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
};

type FetchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; error: string }
  | { kind: "not_configured" }
  | { kind: "ready"; events: Event[] };

function formatRange(ev: Event) {
  if (ev.allDay) return "All day";
  const start = new Date(ev.start);
  const end = new Date(ev.end);
  const fmt: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  return `${start.toLocaleTimeString([], fmt)} – ${end.toLocaleTimeString([], fmt)}`;
}

export function CalendarPanel({ dateInputId }: { dateInputId: string }) {
  const [date, setDate] = useState<string>("");
  const [state, setState] = useState<FetchState>({ kind: "idle" });

  useEffect(() => {
    const el = document.getElementById(dateInputId) as HTMLInputElement | null;
    if (!el) return;
    const handler = () => setDate(el.value);
    handler();
    el.addEventListener("change", handler);
    el.addEventListener("input", handler);
    return () => {
      el.removeEventListener("change", handler);
      el.removeEventListener("input", handler);
    };
  }, [dateInputId]);

  useEffect(() => {
    if (!date) {
      setState({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });
    fetch(`/api/calendar/events?date=${encodeURIComponent(date)}`)
      .then(async (r) => {
        const data = await r.json();
        if (cancelled) return;
        if (data.configured === false) {
          setState({ kind: "not_configured" });
        } else if (data.error) {
          setState({ kind: "error", error: data.error });
        } else {
          setState({ kind: "ready", events: data.events ?? [] });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ kind: "error", error: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  if (state.kind === "not_configured" || state.kind === "idle") return null;

  return (
    <div className="calendarPanel">
      <div className="calendarPanelHead">
        <span>Calendar that day</span>
        {state.kind === "loading" && <span className="muted" style={{ fontSize: 12 }}>Loading…</span>}
      </div>
      {state.kind === "error" && (
        <div className="muted" style={{ fontSize: 13 }}>
          Could not load events: {state.error}
        </div>
      )}
      {state.kind === "ready" && state.events.length === 0 && (
        <div className="muted" style={{ fontSize: 13 }}>Nothing on the calendar.</div>
      )}
      {state.kind === "ready" &&
        state.events.map((ev, i) => (
          <div key={i} className="calendarEvent">
            <div className="calendarEventTime">{formatRange(ev)}</div>
            <div>
              <div className="calendarEventTitle">{ev.title}</div>
              {ev.location && (
                <div className="muted" style={{ fontSize: 12 }}>{ev.location}</div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
