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
            <label htmlFor="rate">Rate (optional)</label>
            <input id="rate" name="rate" placeholder="$25/hr" />
          </div>
          <div className="field">
            <label htmlFor="availability">Notes (optional)</label>
            <input id="availability" name="availability" placeholder="e.g. prefers advance notice" />
          </div>
          <div className="field">
            <label htmlFor="priority">Priority (1-10)</label>
            <input id="priority" name="priority" type="number" min={1} max={10} step={1} defaultValue={5} />
            <div className="muted" style={{ fontSize: 12 }}>
              10 = ask first, 1 = ask last. Use the +/– buttons or type a number.
            </div>
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
