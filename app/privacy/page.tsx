import Link from "next/link";

export const metadata = { title: "Privacy Policy · Babysitter" };

export default function PrivacyPage() {
  return (
    <>
      <h1 className="h1">Privacy Policy</h1>
      <div className="card">
        <p className="muted">Last updated: April 18, 2026</p>

        <h2 className="h2" style={{ marginTop: 20 }}>Who operates this app</h2>
        <p>
          This is a small, personal application operated by Kyle Schanzer as an
          individual (sole proprietor) for the purpose of coordinating
          babysitting schedules with a private list of known contacts.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>What information is collected</h2>
        <ul>
          <li>
            <strong>Sitter contact details</strong> (name and mobile phone
            number) — entered manually by the operator, with the contact&rsquo;s
            permission.
          </li>
          <li>
            <strong>Availability</strong> — weekly schedule and notes the
            operator records to help pick who to text first.
          </li>
          <li>
            <strong>Message history</strong> — outbound SMS the app sends and
            inbound replies (YES / NO / MAYBE plus any free-text reply).
          </li>
        </ul>

        <h2 className="h2" style={{ marginTop: 20 }}>How information is used</h2>
        <p>
          Contact details are used solely to send one-to-one SMS messages
          asking about availability for a specific date and time, and to
          record the reply. Nothing is used for marketing, advertising, or
          profiling.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>SMS messaging program</h2>
        <p>
          By providing a mobile phone number to the operator and consenting to
          receive messages, a recipient is opted in to a transactional SMS
          program used to coordinate babysitting availability.
        </p>
        <ul>
          <li>
            <strong>Message frequency</strong> varies and depends on how often
            the operator needs a sitter — typically 0&ndash;4 messages per
            month per recipient.
          </li>
          <li>
            <strong>Message and data rates may apply</strong> based on the
            recipient&rsquo;s mobile carrier plan.
          </li>
          <li>
            Reply <strong>STOP</strong> at any time to be removed from further
            messages. Reply <strong>HELP</strong> for assistance. Carriers
            honor STOP automatically.
          </li>
          <li>
            No mobile information (phone numbers or message content) will be
            shared with third parties or affiliates for marketing or
            promotional purposes. Information is shared only with the
            subprocessors listed below as strictly required to deliver the
            messages.
          </li>
        </ul>

        <h2 className="h2" style={{ marginTop: 20 }}>Sharing</h2>
        <p>
          Personal information is not sold, rented, or shared with third
          parties for marketing. The only third parties involved are
          infrastructure providers required to operate the app:
        </p>
        <ul>
          <li><strong>Twilio</strong> — delivers the SMS messages.</li>
          <li><strong>Railway</strong> — hosts the app and its database.</li>
        </ul>

        <h2 className="h2" style={{ marginTop: 20 }}>Retention and deletion</h2>
        <p>
          Contact details and message history are retained only as long as the
          operator is using this app. To have your information removed,
          contact the operator directly and it will be deleted from the
          database.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>Contact</h2>
        <p>
          Questions about this policy can be directed to the operator at the
          email address on file.
        </p>

        <p style={{ marginTop: 24 }}>
          <Link href="/terms">Terms of Service</Link>
        </p>
      </div>
    </>
  );
}
