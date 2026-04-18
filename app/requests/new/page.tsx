import Link from "next/link";
import { prisma } from "@/lib/db";
import { createRequest } from "../actions";
import { formatWeekly } from "@/lib/availability";

export const dynamic = "force-dynamic";

export default async function NewRequestPage() {
  const sitters = await prisma.sitter.findMany({
    where: { active: true },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <h1 className="h1">New request</h1>

      {sitters.length === 0 ? (
        <div className="card">
          <p>
            You need at least one active sitter first.{" "}
            <Link href="/sitters/new">Add one</Link>.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="muted" style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            <strong>How this works:</strong> sitters are asked one at a time in
            priority order. Each gets the wait time below to reply before we
            move to the next. First YES wins. For last-minute needs, check{" "}
            <strong>Ask now</strong> on multiple sitters to text them all at
            once.
          </div>
          <form action={createRequest} className="form">
            <div className="field">
              <label htmlFor="date">Date</label>
              <input id="date" name="date" type="date" required />
            </div>
            <div className="row" style={{ gap: 12 }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="startTime">Start time</label>
                <input id="startTime" name="startTime" type="time" required defaultValue="18:00" />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="endTime">End time</label>
                <input id="endTime" name="endTime" type="time" required defaultValue="22:00" />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="timeoutMinutes">Wait (min)</label>
                <input id="timeoutMinutes" name="timeoutMinutes" type="number" min={1} step={1} defaultValue={30} required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="notes">Extra notes (optional)</label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Two kids, ages 4 and 7. Pay is $25/hr."
              />
            </div>
            <div className="field">
              <label>Sitters to ask (in priority order)</label>
              <div className="sitterPickGrid">
                <div className="sitterPickHead">
                  <span>Include</span>
                  <span>Ask now</span>
                  <span>Sitter</span>
                </div>
                {sitters.map((s) => {
                  const weekly = formatWeekly(s.weeklyAvailability);
                  const detail = [weekly, s.availability].filter(Boolean).join(" · ") || "no availability set";
                  return (
                    <div key={s.id} className="sitterPickRow">
                      <input
                        type="checkbox"
                        name="sitterIds"
                        value={s.id}
                        defaultChecked
                        aria-label={`Include ${s.name}`}
                      />
                      <input
                        type="checkbox"
                        name="immediateSitterIds"
                        value={s.id}
                        aria-label={`Ask ${s.name} immediately`}
                      />
                      <span>
                        <strong>{s.name}</strong>{" "}
                        <span className="muted">
                          — {detail} · priority {s.priority}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                Check <strong>Ask now</strong> on sitters you want to text
                simultaneously. Unchecked sitters wait in the queue.
              </div>
            </div>
            <div className="row">
              <button className="btn btnPrimary" type="submit">
                Start texting
              </button>
              <Link href="/requests" className="btn">Cancel</Link>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
