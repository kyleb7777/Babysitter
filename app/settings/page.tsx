import { getSetting, SETTING_KEYS } from "@/lib/settings";
import { fetchTwilioStatus } from "@/lib/twilio-status";
import { disconnectCalendar, saveCalendarUrl } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · Babysitter" };

function maskUrl(url: string): string {
  if (url.length <= 40) return url;
  return `${url.slice(0, 32)}…${url.slice(-10)}`;
}

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

function a2pBadge(status: string) {
  const s = status.toUpperCase();
  if (["APPROVED", "VERIFIED", "REGISTERED"].includes(s)) return "FILLED";
  if (["FAILED", "REJECTED", "SUSPENDED"].includes(s)) return "ERROR";
  if (["IN_REVIEW", "IN_PROGRESS", "PENDING", "PENDING_REVIEW"].includes(s))
    return "MAYBE";
  return "PENDING";
}

export default async function SettingsPage() {
  const [currentUrl, twilio] = await Promise.all([
    getSetting(SETTING_KEYS.calendarIcsUrl),
    fetchTwilioStatus(),
  ]);
  const calendarUrl = currentUrl ?? "";

  return (
    <>
      <h1 className="h1">Settings</h1>

      <div className="card">
        <h2 className="h2">Family calendar</h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Paste the <strong>Secret address in iCal format</strong> from Google
          Calendar → your family calendar → Settings → Integrate calendar.
          Leave blank to disconnect. Anyone with this URL can read the
          calendar, so don&rsquo;t share it.
        </p>

        {calendarUrl && (
          <div className="ok" style={{ marginBottom: 16 }}>
            Connected: <code>{maskUrl(calendarUrl)}</code>
          </div>
        )}

        <form action={saveCalendarUrl} className="form">
          <div className="field">
            <label htmlFor="calendarIcsUrl">ICS URL</label>
            <input
              id="calendarIcsUrl"
              name="calendarIcsUrl"
              type="url"
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
              defaultValue={calendarUrl}
            />
          </div>
          <div className="row">
            <button className="btn btnPrimary" type="submit">
              {calendarUrl ? "Update" : "Connect"}
            </button>
          </div>
        </form>

        {calendarUrl && (
          <form action={disconnectCalendar} style={{ marginTop: 12 }}>
            <button className="btn btnDanger" type="submit">
              Disconnect calendar
            </button>
          </form>
        )}
      </div>

      {!twilio.ok && (
        <div className="error" style={{ marginTop: 14 }}>
          Could not reach Twilio: {twilio.error}
        </div>
      )}

      <div className="card">
        <h2 className="h2">Twilio account</h2>
        {twilio.account ? (
          <div className="statGrid">
            <div>
              <div className="muted">Friendly name</div>
              <div style={{ fontWeight: 600 }}>
                {twilio.account.friendlyName || <span className="muted">—</span>}
              </div>
            </div>
            <div>
              <div className="muted">Status</div>
              <span
                className={`badge badge-${
                  twilio.account.status === "active" ? "FILLED" : "ERROR"
                }`}
              >
                {twilio.account.status}
              </span>
            </div>
            <div>
              <div className="muted">Type</div>
              <div style={{ fontWeight: 600 }}>
                {twilio.account.type || <span className="muted">—</span>}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="muted">Account SID</div>
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 13,
                  wordBreak: "break-all",
                }}
              >
                {twilio.account.sid}
              </div>
            </div>
          </div>
        ) : (
          <div className="muted">Not available.</div>
        )}
      </div>

      <div className="card">
        <h2 className="h2">From number</h2>
        {twilio.phone ? (
          twilio.phone.notFound ? (
            <div className="error">
              <strong>{twilio.phone.number}</strong> is not registered on this
              Twilio account. Check that <code>TWILIO_FROM_NUMBER</code>{" "}
              matches a number you actually own.
            </div>
          ) : (
            <div className="statGrid">
              <div>
                <div className="muted">Phone</div>
                <div style={{ fontWeight: 600 }}>{twilio.phone.number}</div>
              </div>
              <div>
                <div className="muted">Friendly name</div>
                <div style={{ fontWeight: 600 }}>
                  {twilio.phone.friendlyName || <span className="muted">—</span>}
                </div>
              </div>
              <div>
                <div className="muted">Capabilities</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className={`badge badge-${twilio.phone.sms ? "FILLED" : "ERROR"}`}>
                    SMS {twilio.phone.sms ? "✓" : "✗"}
                  </span>
                  <span className={`badge badge-${twilio.phone.mms ? "FILLED" : "ERROR"}`}>
                    MMS {twilio.phone.mms ? "✓" : "✗"}
                  </span>
                  <span className={`badge badge-${twilio.phone.voice ? "FILLED" : "ERROR"}`}>
                    Voice {twilio.phone.voice ? "✓" : "✗"}
                  </span>
                </div>
              </div>
              <div>
                <div className="muted">Purchased</div>
                <div style={{ fontWeight: 600 }}>
                  {formatWhen(twilio.phone.dateCreated)}
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
                  {twilio.phone.smsMethod ? `${twilio.phone.smsMethod} ` : ""}
                  {twilio.phone.smsUrl || (
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

      <div className="card">
        <h2 className="h2">A2P 10DLC registration</h2>
        {twilio.a2pError ? (
          <div className="muted">Could not fetch A2P data: {twilio.a2pError}</div>
        ) : (
          <>
            <div style={{ marginBottom: 12, fontSize: 13 }} className="muted">
              Required for US SMS delivery from 10-digit numbers. Must be
              approved before outbound texts will be delivered by carriers.
            </div>
            <div style={{ marginBottom: 12 }}>
              <div
                className="muted"
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                Brands
              </div>
              {twilio.brands && twilio.brands.length > 0 ? (
                <div style={{ display: "grid", gap: 6 }}>
                  {twilio.brands.map((b) => (
                    <div
                      key={b.sid}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: 10,
                        alignItems: "center",
                        padding: "10px 12px",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        background: "var(--bg-subtle)",
                      }}
                    >
                      <span className={`badge badge-${a2pBadge(b.status)}`}>
                        {b.status}
                      </span>
                      <span style={{ fontSize: 13 }}>
                        {b.brandType || "Brand"}
                        {b.failureReason && (
                          <div
                            className="muted"
                            style={{ fontSize: 12, marginTop: 2 }}
                          >
                            {b.failureReason}
                          </div>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted">No brand registered.</div>
              )}
            </div>
            <div>
              <div
                className="muted"
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                Campaigns
              </div>
              {twilio.campaigns && twilio.campaigns.length > 0 ? (
                <div style={{ display: "grid", gap: 6 }}>
                  {twilio.campaigns.map((c) => (
                    <div
                      key={c.sid}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: 10,
                        alignItems: "center",
                        padding: "10px 12px",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        background: "var(--bg-subtle)",
                      }}
                    >
                      <span className={`badge badge-${a2pBadge(c.status)}`}>
                        {c.status}
                      </span>
                      <span style={{ fontSize: 13 }}>
                        {c.useCase || "Campaign"}
                        {c.description && (
                          <div
                            className="muted"
                            style={{
                              fontSize: 12,
                              marginTop: 2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {c.description}
                          </div>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted">No campaign registered.</div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2 className="h2">Recent messages (last 10)</h2>
        {twilio.messages && twilio.messages.length > 0 ? (
          <div style={{ display: "grid", gap: 10 }}>
            {twilio.messages.map((m) => (
              <div
                key={m.sid}
                style={{
                  padding: 12,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-subtle)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.to}</div>
                  <span className={`badge badge-${statusBadge(m.status)}`}>
                    {m.status}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {formatWhen(m.dateCreated)}
                </div>
                {m.errorCode && (
                  <div
                    className="muted"
                    style={{ fontSize: 12, marginTop: 4, color: "var(--red)" }}
                  >
                    <strong>{m.errorCode}</strong>
                    {m.errorMessage ? ` — ${m.errorMessage}` : ""}
                  </div>
                )}
                {m.body && (
                  <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>
                    {m.body}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No messages sent yet.</div>
        )}
      </div>
    </>
  );
}
