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
      <div className="row" style={{ marginBottom: 20 }}>
        <h1 className="h1" style={{ margin: 0 }}>Sitters</h1>
        <div className="spacer" />
        <Link href="/sitters/new" className="btn btnPrimary">Add sitter</Link>
      </div>

      {sitters.length === 0 ? (
        <div className="card">
          <div className="empty">
            No sitters yet. <Link href="/sitters/new">Add your first one.</Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Availability</th>
                <th>Priority</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sitters.map((s) => {
                const weekly = formatWeekly(s.weeklyAvailability);
                return (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.phone}</td>
                  <td>
                    {weekly || <span className="muted">—</span>}
                    {s.availability && (
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{s.availability}</div>
                    )}
                  </td>
                  <td>{s.priority}</td>
                  <td>
                    <span className={`badge badge-${s.active ? "YES" : "NO"}`}>
                      {s.active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/sitters/${s.id}/edit`} className="btn">Edit</Link>{" "}
                    <form action={deleteSitter} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="btn btnDanger" type="submit">Delete</button>
                    </form>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
