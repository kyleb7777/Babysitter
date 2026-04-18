"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { advanceRequest, sweepTimeouts } from "@/lib/outreach";

const schema = z.object({
  date: z.string().trim().min(1, "Date is required"),
  timeWindow: z.string().trim().min(1, "Time window is required"),
  notes: z.string().trim().optional().nullable(),
  sitterIds: z.array(z.string()).min(1, "Pick at least one sitter"),
});

export async function createRequest(formData: FormData) {
  const sitterIds = formData.getAll("sitterIds").map(String);
  const parsed = schema.parse({
    date: formData.get("date"),
    timeWindow: formData.get("timeWindow"),
    notes: formData.get("notes") || null,
    sitterIds,
  });

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

  const request = await prisma.sitterRequest.create({
    data: {
      date: parsed.date,
      timeWindow: parsed.timeWindow,
      notes: parsed.notes ?? null,
      outreaches: {
        create: ordered.map((s, i) => ({
          sitterId: s.id,
          order: i,
          status: "QUEUED",
        })),
      },
    },
  });

  await advanceRequest(request.id);
  revalidatePath("/requests");
  redirect(`/requests/${request.id}`);
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
