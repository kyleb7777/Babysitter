import Link from "next/link";
import { prisma } from "@/lib/db";
import { createRequest } from "../actions";
import { formatWeekly } from "@/lib/availability";

export const dynamic = "force-dynamic";

export default async function NewRequestPage() {
  const sitters = await prisma.sitter.findMany({
    where: { active: true },
    orderBy: [{ priority: "asc" }, { name: "asc" }],
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
              <label>Sitters to ask (in order)</label>
              <div style={{ display: "grid", gap: 6 }}>
                {sitters.map((s) => {
                  const weekly = formatWeekly(s.weeklyAvailability);
                  const detail = [weekly, s.availability].filter(Boolean).join(" · ") || "no availability set";
                  return (
                    <label key={s.id} className="row" style={{ gap: 8 }}>
                      <input
                        type="checkbox"
                        name="sitterIds"
                        value={s.id}
                        defaultChecked
                      />
                      <span>
                        <strong>{s.name}</strong>{" "}
                        <span className="muted">
                          — {detail} · priority {s.priority}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                Order follows sitter priority. Edit a sitter's priority to reorder.
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
