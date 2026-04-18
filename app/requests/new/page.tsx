import Link from "next/link";
import { prisma } from "@/lib/db";
import { createRequest } from "../actions";

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
            <div className="field">
              <label htmlFor="timeWindow">Time window</label>
              <input
                id="timeWindow"
                name="timeWindow"
                required
                placeholder="6-10pm"
              />
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
                {sitters.map((s) => (
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
                        — {s.availability || "no availability set"} · priority {s.priority}
                      </span>
                    </span>
                  </label>
                ))}
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
