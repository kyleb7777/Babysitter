import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateSitter } from "../../actions";
import { AvailabilityFields } from "../../AvailabilityFields";
import type { WeeklyAvailability } from "@/lib/availability";

export default async function EditSitterPage({ params }: { params: { id: string } }) {
  const sitter = await prisma.sitter.findUnique({ where: { id: params.id } });
  if (!sitter) notFound();

  return (
    <>
      <h1 className="h1">Edit sitter</h1>
      <div className="card">
        <form action={updateSitter} className="form">
          <input type="hidden" name="id" value={sitter.id} />
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" required defaultValue={sitter.name} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" required defaultValue={sitter.phone} />
          </div>
          <div className="field">
            <label>Weekly availability</label>
            <AvailabilityFields value={sitter.weeklyAvailability as WeeklyAvailability | null} />
          </div>
          <div className="field">
            <label htmlFor="availability">Notes (optional)</label>
            <input id="availability" name="availability" defaultValue={sitter.availability} />
          </div>
          <div className="field">
            <label htmlFor="priority">Priority (1-10)</label>
            <input id="priority" name="priority" type="number" min={1} max={10} step={1} defaultValue={sitter.priority} />
            <div className="muted" style={{ fontSize: 12 }}>
              10 = ask first, 1 = ask last. Use the +/– buttons or type a number.
            </div>
          </div>
          <div className="field row">
            <input id="active" name="active" type="checkbox" defaultChecked={sitter.active} />
            <label htmlFor="active" style={{ margin: 0 }}>Active</label>
          </div>
          <div className="row">
            <button className="btn btnPrimary" type="submit">Save changes</button>
            <Link href="/sitters" className="btn">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}
