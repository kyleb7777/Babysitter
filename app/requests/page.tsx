import Link from "next/link";
import { prisma } from "@/lib/db";
import { deleteRequest, sweep } from "./actions";

export const dynamic = "force-dynamic";

function formatDayHeader(dateString: string) {
  const [y, m, d] = dateString.split("-").map((n) => parseInt(n, 10));
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return anchor.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

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
      <div className="pageHead">
        <h1 className="h1">Requests</h1>
        <Link href="/requests/new" className="btn btnPrimary btnSmall">
          + New
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="card">
          <div className="empty">
            No requests yet. <Link href="/requests/new">Start one</Link>.
          </div>
        </div>
      ) : (
        <>
          <div>
            {requests.map((r) => {
              const filledBy = r.outreaches.find((o) => o.status === "YES");
              const current = r.outreaches.find((o) => o.status === "SENT");
              const done = r.outreaches.filter((o) =>
                ["YES", "NO", "TIMEOUT", "ERROR"].includes(o.status),
              ).length;
              return (
                <div key={r.id} className="listItem">
                  <div className="listItemHead">
                    <div>
                      <div className="listItemTitle">
                        {formatDayHeader(r.date)} · {r.timeWindow}
                      </div>
                      <div className="listItemSub">
                        {done}/{r.outreaches.length} asked
                        {current ? ` · waiting on ${current.sitter.name}` : ""}
                      </div>
                    </div>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </div>
                  {filledBy && (
                    <div className="listItemSub" style={{ marginTop: 6 }}>
                      Booked with <strong style={{ color: "var(--fg)" }}>{filledBy.sitter.name}</strong>
                    </div>
                  )}
                  <div className="listItemActions">
                    <Link href={`/requests/${r.id}`} className="btn btnSmall">
                      View
                    </Link>
                    <form action={deleteRequest} style={{ display: "inline-flex" }}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="btn btnDanger btnSmall" type="submit">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <form action={sweepAction}>
              <button
                className="btn btnSmall"
                type="submit"
                title="Advance any stalled requests whose timeout has elapsed"
              >
                Run timeout sweep
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
