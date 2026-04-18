import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [sitterCount, pendingCount, filledCount] = await Promise.all([
    prisma.sitter.count({ where: { active: true } }),
    prisma.sitterRequest.count({ where: { status: "PENDING" } }),
    prisma.sitterRequest.count({ where: { status: "FILLED" } }),
  ]);

  return (
    <>
      <h1 className="h1">Babysitter</h1>
      <p className="muted" style={{ marginTop: -12, marginBottom: 24 }}>
        Text your sitter list one at a time until someone says yes.
      </p>

      <div className="card">
        <h2 className="h2">Quick stats</h2>
        <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
          <Stat label="Active sitters" value={sitterCount} />
          <Stat label="Open requests" value={pendingCount} />
          <Stat label="Filled" value={filledCount} />
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Get started</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.7 }}>
          <li>
            <Link href="/sitters">Add your sitters</Link> with phone numbers and
            availability notes.
          </li>
          <li>
            <Link href="/requests/new">Start a new request</Link> for a specific
            night. We'll text them in order until someone confirms.
          </li>
          <li>
            Replies come back automatically — check{" "}
            <Link href="/requests">Requests</Link> to see who said yes.
          </li>
        </ol>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div className="muted">{label}</div>
    </div>
  );
}
