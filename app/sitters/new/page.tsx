import Link from "next/link";
import { createSitter } from "../actions";
import { AvailabilityFields } from "../AvailabilityFields";

export default function NewSitterPage() {
  return (
    <>
      <h1 className="h1">Add sitter</h1>
      <div className="card">
        <form action={createSitter} className="form">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" required placeholder="Jane Doe" />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" required placeholder="555-123-4567" />
          </div>
          <div className="field">
            <label>Weekly availability</label>
            <AvailabilityFields />
          </div>
          <div className="field">
            <label htmlFor="availability">Notes (optional)</label>
            <input id="availability" name="availability" placeholder="e.g. prefers advance notice" />
          </div>
          <div className="field">
            <label htmlFor="priority">Priority (lower = asked first)</label>
            <input id="priority" name="priority" type="number" defaultValue={100} />
          </div>
          <div className="field row">
            <input id="active" name="active" type="checkbox" defaultChecked />
            <label htmlFor="active" style={{ margin: 0 }}>Active</label>
          </div>
          <div className="row">
            <button className="btn btnPrimary" type="submit">Save sitter</button>
            <Link href="/sitters" className="btn">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}
