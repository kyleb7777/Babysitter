"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { advanceRequest, blastOutreaches, sweepTimeouts } from "@/lib/outreach";
import { formatTimeWindow } from "@/lib/calendar";

const schema = z.object({
  date: z.string().trim().min(1, "Date is required"),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Start time is required"),
  endTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "End time is required"),
  timeoutMinutes: z.coerce.number().int().min(1).max(24 * 60).default(30),
  notes: z.string().trim().optional().nullable(),
  sitterIds: z.array(z.string()).min(1, "Pick at least one sitter"),
  immediateSitterIds: z.array(z.string()).default([]),
});

export async function createRequest(formData: FormData) {
  const sitterIds = formData.getAll("sitterIds").map(String);
  const immediateSitterIds = formData.getAll("immediateSitterIds").map(String);
  const parsed = schema.parse({
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    timeoutMinutes: formData.get("timeoutMinutes") ?? 30,
    notes: formData.get("notes") || null,
    sitterIds,
    immediateSitterIds,
  });
  const timeWindow = formatTimeWindow(parsed.startTime, parsed.endTime);

  // Keep the checkbox order (which mirrors priority) so outreach.order is stable.
  const sitters = await prisma.sitter.findMany({
    where: { id: { in: parsed.sitterIds }, active: true },
  });
  const byId = new Map(sitters.map((s) => [s.id, s]));
  const ordered = parsed.sitterIds
    .map((id) => byId.get(id))
    .filter((s): s is (typeof sitters)[number] => Boolean(s));

  if (ordered.length === 0) {
    throw new Error("No active sitters selected.");
  }

  const includedIds = new Set(ordered.map((s) => s.id));
  const immediateSet = new Set(
    parsed.immediateSitterIds.filter((id) => includedIds.has(id)),
  );

  const request = await prisma.sitterRequest.create({
    data: {
      date: parsed.date,
      timeWindow,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      timeoutMinutes: parsed.timeoutMinutes,
      notes: parsed.notes ?? null,
      outreaches: {
        create: ordered.map((s, i) => ({
          sitterId: s.id,
          order: i,
          status: "QUEUED",
        })),
      },
    },
    include: { outreaches: true },
  });

  if (immediateSet.size > 0) {
    const immediateOutreachIds = request.outreaches
      .filter((o) => immediateSet.has(o.sitterId))
      .map((o) => o.id);
    const { allFailed } = await blastOutreaches(immediateOutreachIds);
    // If every immediate send failed, fall back to the regular waterfall so
    // the request still progresses.
    if (allFailed) await advanceRequest(request.id);
  } else {
    await advanceRequest(request.id);
  }

  revalidatePath("/requests");
  redirect(`/requests/${request.id}`);
}

export async function deleteRequest(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.sitterRequest.delete({ where: { id } });
  revalidatePath("/requests");
  redirect("/requests");
}

export async function cancelRequest(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.sitterRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
}

export async function retryRequest(formData: FormData) {
  const id = String(formData.get("id"));
  await advanceRequest(id);
  revalidatePath(`/requests/${id}`);
}

export async function sweep() {
  const n = await sweepTimeouts();
  revalidatePath("/requests");
  return n;
}

export async function skipCurrent(formData: FormData) {
  const requestId = String(formData.get("requestId"));
  const outreachId = String(formData.get("outreachId"));
  await prisma.outreach.update({
    where: { id: outreachId },
    data: { status: "TIMEOUT" },
  });
  await advanceRequest(requestId);
  revalidatePath(`/requests/${requestId}`);
}
