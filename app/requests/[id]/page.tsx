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

  return (
    <>
      <div className="pageHead">
        <h1 className="h1">Request</h1>
        <Link href="/requests" className="btn btnGhost btnSmall">
          ← Back
        </Link>
      </div>

      <div className="card">
        <div className="kvGrid">
          <div className="kv">
            <span className="muted">Date</span>
            <span className="kvValue">{r.date}</span>
          </div>
          <div className="kv">
            <span className="muted">Time</span>
            <span className="kvValue">{r.timeWindow}</span>
          </div>
          <div className="kv">
            <span className="muted">Wait</span>
            <span className="kvValue">{r.timeoutMinutes} min</span>
          </div>
          <div className="kv">
            <span className="muted">Status</span>
            <span>
              <span className={`badge badge-${r.status}`}>{r.status}</span>
            </span>
          </div>
        </div>

        {inFlight.length > 0 && r.status === "PENDING" && (
          <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
            Waiting on{" "}
            <strong>{inFlight.map((o) => o.sitter.name).join(", ")}</strong>
            {inFlight[0].sentAt && (
              <>
                {" "}— next asked at{" "}
                {new Date(
                  inFlight[0].sentAt.getTime() + r.timeoutMinutes * 60 * 1000,
                ).toLocaleTimeString()} if no reply
              </>
            )}
            .
          </p>
        )}
        {r.notes && (
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            Notes: {r.notes}
          </p>
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

        <div className="listItemActions" style={{ marginTop: 16 }}>
          {r.status === "PENDING" && (
            <form action={retryRequest}>
              <input type="hidden" name="id" value={r.id} />
              <button className="btn btnSmall" type="submit">
                Send next
              </button>
            </form>
          )}
          {r.status === "PENDING" && (
            <form action={cancelRequest}>
              <input type="hidden" name="id" value={r.id} />
              <button className="btn btnDanger btnSmall" type="submit">
                Cancel
              </button>
            </form>
          )}
          <form action={deleteRequest}>
            <input type="hidden" name="id" value={r.id} />
            <button className="btn btnDanger btnSmall" type="submit">
              Delete
            </button>
          </form>
        </div>
      </div>

      <h2 className="h2" style={{ marginTop: 24, marginBottom: 10, paddingLeft: 4 }}>
        Outreach ({r.outreaches.length})
      </h2>

      {r.outreaches.map((o) => {
        const isCurrent = inFlight.some((f) => f.id === o.id);
        return (
          <div key={o.id} className="listItem">
            <div className="listItemHead">
              <div>
                <div className="listItemTitle">
                  <span className="muted" style={{ fontSize: 13, fontWeight: 500, marginRight: 6 }}>
                    #{o.order + 1}
                  </span>
                  {o.sitter.name}
                </div>
                <div className="listItemSub">{o.sitter.phone}</div>
              </div>
              <span className={`badge badge-${o.status}`}>{o.status}</span>
            </div>
            {o.sentAt && (
              <div className="listItemSub" style={{ marginTop: 6 }}>
                Sent {formatWhen(o.sentAt)}
              </div>
            )}
            {o.replyBody && (
              <div className="listItemSub" style={{ marginTop: 6, fontStyle: "italic" }}>
                &ldquo;{o.replyBody}&rdquo;
                {o.repliedAt && (
                  <span style={{ fontStyle: "normal", marginLeft: 6 }}>
                    · {formatWhen(o.repliedAt)}
                  </span>
                )}
              </div>
            )}
            {o.errorText && (
              <div className="listItemSub" style={{ marginTop: 6, color: "var(--red)" }}>
                {o.errorText}
              </div>
            )}
            {isCurrent && r.status === "PENDING" && (
              <div className="listItemActions">
                <form action={skipCurrent}>
                  <input type="hidden" name="requestId" value={r.id} />
                  <input type="hidden" name="outreachId" value={o.id} />
                  <button className="btn btnSmall" type="submit">
                    Skip
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function formatWhen(d: Date) {
  return new Date(d).toLocaleString();
}
