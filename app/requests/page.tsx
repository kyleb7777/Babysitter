import Link from "next/link";
import { prisma } from "@/lib/db";
import { sweep } from "./actions";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const requests = await prisma.sitterRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      outreaches: {
        include: { sitter: true },
        orderBy: { order: "asc" },
      },
    },
  });

  async function sweepAction() {
    "use server";
    await sweep();
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 20 }}>
        <h1 className="h1" style={{ margin: 0 }}>Requests</h1>
        <div className="spacer" />
        <form action={sweepAction} style={{ display: "inline" }}>
          <button className="btn" type="submit" title="Advance any stalled requests whose timeout has elapsed">
            Run timeout sweep
          </button>
        </form>{" "}
        <Link href="/requests/new" className="btn btnPrimary">New request</Link>
      </div>

      {requests.length === 0 ? (
        <div className="card">
          <div className="empty">
            No requests yet. <Link href="/requests/new">Start one</Link>.
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Filled by</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const filledBy = r.outreaches.find((o) => o.status === "YES");
                const current = r.outreaches.find((o) => o.status === "SENT");
                const done = r.outreaches.filter((o) =>
                  ["YES", "NO", "TIMEOUT", "ERROR"].includes(o.status)
                ).length;
                return (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.timeWindow}</td>
                    <td>
                      <span className={`badge badge-${r.status}`}>{r.status}</span>
                    </td>
                    <td>
                      {done}/{r.outreaches.length}
                      {current ? ` · waiting on ${current.sitter.name}` : ""}
                    </td>
                    <td>{filledBy ? filledBy.sitter.name : "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/requests/${r.id}`} className="btn">View</Link>
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
