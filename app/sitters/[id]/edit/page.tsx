import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateSitter } from "../../actions";

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
            <label htmlFor="availability">General availability</label>
            <input id="availability" name="availability" defaultValue={sitter.availability} />
          </div>
          <div className="field">
            <label htmlFor="priority">Priority (lower = asked first)</label>
            <input id="priority" name="priority" type="number" defaultValue={sitter.priority} />
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
