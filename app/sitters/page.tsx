import Link from "next/link";
import { prisma } from "@/lib/db";
import { deleteSitter } from "./actions";
import { formatWeekly } from "@/lib/availability";

export const dynamic = "force-dynamic";

export default async function SittersPage() {
  const sitters = await prisma.sitter.findMany({
    orderBy: [{ active: "desc" }, { priority: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <div className="pageHead">
        <h1 className="h1">Sitters</h1>
        <Link href="/sitters/new" className="btn btnPrimary btnSmall">
          + Add
        </Link>
      </div>

      {sitters.length === 0 ? (
        <div className="card">
          <div className="empty">
            No sitters yet. <Link href="/sitters/new">Add your first one.</Link>
          </div>
        </div>
      ) : (
        <div>
          {sitters.map((s) => {
            const weekly = formatWeekly(s.weeklyAvailability);
            return (
              <div key={s.id} className="listItem">
                <div className="listItemHead">
                  <div>
                    <div className="listItemTitle">{s.name}</div>
                    <div className="listItemSub">{s.phone}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span
                      className={`badge badge-${s.active ? "YES" : "NO"}`}
                    >
                      {s.active ? "Active" : "Paused"}
                    </span>
                  </div>
                </div>
                <div className="listItemSub" style={{ marginTop: 6 }}>
                  {weekly || <span className="muted">No weekly schedule set</span>}
                  {s.availability && (
                    <div style={{ marginTop: 2 }}>{s.availability}</div>
                  )}
                </div>
                <div
                  className="listItemSub"
                  style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}
                >
                  <span>
                    Priority <strong style={{ color: "var(--fg)" }}>{s.priority}</strong>
                  </span>
                  {s.rate && (
                    <span>
                      Rate <strong style={{ color: "var(--fg)" }}>{s.rate}</strong>
                    </span>
                  )}
                </div>
                <div className="listItemActions">
                  <Link href={`/sitters/${s.id}/edit`} className="btn btnSmall">
                    Edit
                  </Link>
                  <form action={deleteSitter} style={{ display: "inline-flex" }}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn btnDanger btnSmall" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
