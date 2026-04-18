import { getSetting, SETTING_KEYS } from "@/lib/settings";
import { disconnectCalendar, saveCalendarUrl } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · Babysitter" };

function maskUrl(url: string): string {
  if (url.length <= 40) return url;
  return `${url.slice(0, 32)}…${url.slice(-10)}`;
}

export default async function SettingsPage() {
  const currentUrl = (await getSetting(SETTING_KEYS.calendarIcsUrl)) ?? "";

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

        {currentUrl && (
          <div className="ok" style={{ marginBottom: 16 }}>
            Connected: <code>{maskUrl(currentUrl)}</code>
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
              defaultValue={currentUrl}
            />
          </div>
          <div className="row">
            <button className="btn btnPrimary" type="submit">
              {currentUrl ? "Update" : "Connect"}
            </button>
          </div>
        </form>

        {currentUrl && (
          <form action={disconnectCalendar} style={{ marginTop: 12 }}>
            <button className="btn btnDanger" type="submit">Disconnect calendar</button>
          </form>
        )}
      </div>
    </>
  );
}
