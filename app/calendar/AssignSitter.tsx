"use client";

import { useRef, useTransition } from "react";
import { assignSitter } from "./actions";

type Sitter = { id: string; name: string };

export function AssignSitter({
  eventUid,
  date,
  startTime,
  endTime,
  title,
  sitters,
}: {
  eventUid: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  title: string;
  sitters: Sitter[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!e.target.value) return;
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    startTransition(() => {
      void assignSitter(fd);
    });
  }

  return (
    <form ref={formRef} style={{ display: "inline-flex" }}>
      <input type="hidden" name="eventUid" value={eventUid} />
      <input type="hidden" name="date" value={date} />
      {startTime && <input type="hidden" name="startTime" value={startTime} />}
      {endTime && <input type="hidden" name="endTime" value={endTime} />}
      <input type="hidden" name="title" value={title} />
      <select
        name="sitterId"
        className="assignSelect"
        defaultValue=""
        onChange={handleChange}
        disabled={pending}
        aria-label="Manually assign a sitter"
      >
        <option value="" disabled>
          {pending ? "Saving…" : "Assign to…"}
        </option>
        {sitters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </form>
  );
}
