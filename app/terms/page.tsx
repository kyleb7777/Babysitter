import Link from "next/link";

export const metadata = { title: "Terms of Service · Babysitter" };

export default function TermsPage() {
  return (
    <>
      <h1 className="h1">Terms of Service</h1>
      <div className="card">
        <p className="muted">Last updated: April 18, 2026</p>

        <h2 className="h2" style={{ marginTop: 20 }}>Program name</h2>
        <p><strong>Babysitter Availability</strong> — a personal SMS program operated by Kyle Schanzer (sole proprietor).</p>

        <h2 className="h2" style={{ marginTop: 20 }}>Program description</h2>
        <p>
          This program sends one-to-one SMS messages from the operator to a
          small private list of babysitters asking whether they are available
          to babysit on a specific date and time. Recipients reply with
          <strong> YES</strong>, <strong>NO</strong>, or <strong>MAYBE</strong>.
          The app then either confirms the booking or moves on to the next
          sitter.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>Message frequency</h2>
        <p>
          Low volume. A recipient typically receives one message per
          babysitting request, and only when the operator is actively looking
          for a sitter — usually no more than a few times per month.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>Message and data rates</h2>
        <p>
          <strong>Message and data rates may apply.</strong> Standard carrier
          charges for SMS apply based on your mobile plan.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>How to opt out (STOP)</h2>
        <p>
          Reply <strong>STOP</strong> at any time to any message from this
          program to stop receiving further texts. Opt-out is immediate.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>How to get help (HELP)</h2>
        <p>
          Reply <strong>HELP</strong> to receive a short response with contact
          information for the operator. You may also contact the operator
          directly through the phone number or email you were given when
          added to the list.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>Consent</h2>
        <p>
          Recipients are added manually by the operator only after giving
          direct personal permission to be contacted by SMS for the purpose
          described above. This program has no public signup form.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>Changes</h2>
        <p>
          These terms may be updated from time to time. The &ldquo;last
          updated&rdquo; date above will change when they do.
        </p>

        <p style={{ marginTop: 24 }}>
          <Link href="/privacy">Privacy Policy</Link>
        </p>
      </div>
    </>
  );
}
