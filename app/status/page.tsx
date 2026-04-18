import { fetchTwilioStatus } from "@/lib/twilio-status";

export const dynamic = "force-dynamic";

export const metadata = { title: "Status · Babysitter" };

function formatWhen(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (["DELIVERED", "SENT"].includes(s)) return "FILLED";
  if (["UNDELIVERED", "FAILED"].includes(s)) return "ERROR";
  if (["QUEUED", "ACCEPTED", "SENDING"].includes(s)) return "QUEUED";
  return "PENDING";
}

export default async function StatusPage() {
  const s = await fetchTwilioStatus();

  return (
    <>
      <h1 className="h1">Status</h1>

      {!s.ok && (
        <div className="error">Could not reach Twilio: {s.error}</div>
      )}

      <div className="card">
        <h2 className="h2">Account</h2>
        {s.account ? (
          <div className="statGrid">
            <div>
              <div className="muted">Friendly name</div>
              <div style={{ fontWeight: 600 }}>
                {s.account.friendlyName || <span className="muted">—</span>}
              </div>
            </div>
            <div>
              <div className="muted">Status</div>
              <span
                className={`badge badge-${
                  s.account.status === "active" ? "FILLED" : "ERROR"
                }`}
              >
                {s.account.status}
              </span>
            </div>
            <div>
              <div className="muted">Type</div>
              <div style={{ fontWeight: 600 }}>
                {s.account.type || <span className="muted">—</span>}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="muted">Account SID</div>
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13 }}>
                {s.account.sid}
              </div>
            </div>
          </div>
        ) : (
          <div className="muted">Not available.</div>
        )}
      </div>

      <div className="card">
        <h2 className="h2">From number</h2>
        {s.phone ? (
          s.phone.notFound ? (
            <div className="error">
              <strong>{s.phone.number}</strong> is not registered on this Twilio
              account. Check that <code>TWILIO_FROM_NUMBER</code> matches a
              number you actually own.
            </div>
          ) : (
            <div className="statGrid">
              <div>
                <div className="muted">Phone</div>
                <div style={{ fontWeight: 600 }}>{s.phone.number}</div>
              </div>
              <div>
                <div className="muted">Friendly name</div>
                <div style={{ fontWeight: 600 }}>
                  {s.phone.friendlyName || <span className="muted">—</span>}
                </div>
              </div>
              <div>
                <div className="muted">Capabilities</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className={`badge badge-${s.phone.sms ? "FILLED" : "ERROR"}`}>
                    SMS {s.phone.sms ? "✓" : "✗"}
                  </span>
                  <span className={`badge badge-${s.phone.mms ? "FILLED" : "ERROR"}`}>
                    MMS {s.phone.mms ? "✓" : "✗"}
                  </span>
                  <span className={`badge badge-${s.phone.voice ? "FILLED" : "ERROR"}`}>
                    Voice {s.phone.voice ? "✓" : "✗"}
                  </span>
                </div>
              </div>
              <div>
                <div className="muted">Purchased</div>
                <div style={{ fontWeight: 600 }}>
                  {formatWhen(s.phone.dateCreated)}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="muted">SMS inbound webhook</div>
                <div
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 13,
                    wordBreak: "break-all",
                  }}
                >
                  {s.phone.smsMethod ? `${s.phone.smsMethod} ` : ""}
                  {s.phone.smsUrl || (
                    <span className="muted">(not configured)</span>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="muted">Not available.</div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "20px 24px 8px" }}>
          <h2 className="h2" style={{ margin: 0 }}>Recent messages (last 10)</h2>
        </div>
        {s.messages && s.messages.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>To</th>
                <th>Status</th>
                <th>Error</th>
                <th>Body</th>
              </tr>
            </thead>
            <tbody>
              {s.messages.map((m) => (
                <tr key={m.sid}>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {formatWhen(m.dateCreated)}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{m.to}</td>
                  <td>
                    <span className={`badge badge-${statusBadge(m.status)}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {m.errorCode ? (
                      <>
                        <strong>{m.errorCode}</strong>
                        {m.errorMessage ? ` — ${m.errorMessage}` : ""}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className="muted"
                    style={{
                      fontSize: 12,
                      maxWidth: 320,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={m.body ?? ""}
                  >
                    {m.body}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">No messages sent yet.</div>
        )}
      </div>
    </>
  );
}
