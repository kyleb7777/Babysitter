import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { cancelRequest, deleteRequest, retryRequest, skipCurrent } from "../actions";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const r = await prisma.sitterRequest.findUnique({
    where: { id: params.id },
    include: {
      outreaches: {
        include: { sitter: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!r) notFound();

  const inFlight = r.outreaches.filter((o) => o.status === "SENT");
  const current = inFlight[0];

  return (
    <>
      <div className="row" style={{ marginBottom: 20 }}>
        <h1 className="h1" style={{ margin: 0 }}>Request</h1>
        <div className="spacer" />
        <Link href="/requests" className="btn">Back</Link>
      </div>

      <div className="card">
        <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
          <div>
            <div className="muted">Date</div>
            <div style={{ fontWeight: 600 }}>{r.date}</div>
          </div>
          <div>
            <div className="muted">Time</div>
            <div style={{ fontWeight: 600 }}>{r.timeWindow}</div>
          </div>
          <div>
            <div className="muted">Wait per sitter</div>
            <div style={{ fontWeight: 600 }}>{r.timeoutMinutes} min</div>
          </div>
          <div>
            <div className="muted">Status</div>
            <span className={`badge badge-${r.status}`}>{r.status}</span>
          </div>
          <div className="spacer" />
          {r.status === "PENDING" && (
            <form action={retryRequest}>
              <input type="hidden" name="id" value={r.id} />
              <button className="btn" type="submit" title="Send the next queued text">
                Send next
              </button>
            </form>
          )}
          {r.status === "PENDING" && (
            <form action={cancelRequest}>
              <input type="hidden" name="id" value={r.id} />
              <button className="btn btnDanger" type="submit">Cancel request</button>
            </form>
          )}
          <form action={deleteRequest}>
            <input type="hidden" name="id" value={r.id} />
            <button className="btn btnDanger" type="submit">Delete</button>
          </form>
        </div>
        {inFlight.length > 0 && r.status === "PENDING" && (
          <p className="muted" style={{ marginTop: 12 }}>
            Waiting on{" "}
            <strong>{inFlight.map((o) => o.sitter.name).join(", ")}</strong>
            {inFlight[0].sentAt && (
              <> — next asked at{" "}
                {new Date(
                  inFlight[0].sentAt.getTime() + r.timeoutMinutes * 60 * 1000,
                ).toLocaleTimeString()} if no reply</>
            )}
            .
          </p>
        )}
        {r.notes && (
          <p className="muted" style={{ marginTop: 12 }}>Notes: {r.notes}</p>
        )}
        {r.calendarEventUid && (
          <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
            Linked to a{" "}
            <Link href="/calendar" style={{ textDecoration: "underline" }}>
              family calendar
            </Link>{" "}
            event.
          </p>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sitter</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Reply</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {r.outreaches.map((o) => (
              <tr key={o.id}>
                <td>{o.order + 1}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{o.sitter.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{o.sitter.phone}</div>
                </td>
                <td>
                  <span className={`badge badge-${o.status}`}>{o.status}</span>
                </td>
                <td className="muted">{o.sentAt ? formatWhen(o.sentAt) : "—"}</td>
                <td>
                  {o.replyBody ? (
                    <span>
                      “{o.replyBody}”
                      <div className="muted" style={{ fontSize: 12 }}>
                        {o.repliedAt ? formatWhen(o.repliedAt) : ""}
                      </div>
                    </span>
                  ) : o.errorText ? (
                    <span className="muted">{o.errorText}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ textAlign: "right" }}>
                  {current?.id === o.id && r.status === "PENDING" && (
                    <form action={skipCurrent} style={{ display: "inline" }}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="outreachId" value={o.id} />
                      <button className="btn" type="submit">Skip</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function formatWhen(d: Date) {
  const date = new Date(d);
  return date.toLocaleString();
}
