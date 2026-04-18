"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { formatTimeWindow } from "@/lib/calendar";
import { notifyBookingConfirmed } from "@/lib/notifications";

export async function dismissEvent(formData: FormData) {
  const eventUid = String(formData.get("eventUid") ?? "");
  if (!eventUid) return;
  await prisma.dismissedEvent.upsert({
    where: { eventUid },
    update: {},
    create: { eventUid },
  });
  revalidatePath("/calendar");
}

export async function undismissEvent(formData: FormData) {
  const eventUid = String(formData.get("eventUid") ?? "");
  if (!eventUid) return;
  await prisma.dismissedEvent
    .delete({ where: { eventUid } })
    .catch(() => {});
  revalidatePath("/calendar");
}

const assignSchema = z.object({
  eventUid: z.string().trim().min(1),
  sitterId: z.string().trim().min(1),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  title: z.string().trim().optional().nullable(),
});

export async function assignSitter(formData: FormData) {
  const parsed = assignSchema.parse({
    eventUid: formData.get("eventUid"),
    sitterId: formData.get("sitterId"),
    date: formData.get("date"),
    startTime: formData.get("startTime") || null,
    endTime: formData.get("endTime") || null,
    title: formData.get("title") || null,
  });

  const sitter = await prisma.sitter.findUnique({ where: { id: parsed.sitterId } });
  if (!sitter) throw new Error("Sitter not found");

  const timeWindow =
    parsed.startTime && parsed.endTime
      ? formatTimeWindow(parsed.startTime, parsed.endTime)
      : "All day";

  const notes = parsed.title ? `Manually assigned. For: ${parsed.title}` : "Manually assigned.";

  const request = await prisma.sitterRequest.create({
    data: {
      date: parsed.date,
      timeWindow,
      startTime: parsed.startTime ?? null,
      endTime: parsed.endTime ?? null,
      timeoutMinutes: 30,
      notes,
      calendarEventUid: parsed.eventUid,
      status: "FILLED",
      filledById: sitter.id,
      outreaches: {
        create: [
          {
            sitterId: sitter.id,
            order: 0,
            status: "YES",
            sentAt: new Date(),
            repliedAt: new Date(),
            replyBody: "(manually assigned)",
          },
        ],
      },
    },
  });

  void notifyBookingConfirmed({
    sitterName: sitter.name,
    sitterPhone: sitter.phone,
    request: {
      date: request.date,
      timeWindow: request.timeWindow,
      startTime: request.startTime,
      endTime: request.endTime,
      notes: request.notes,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/requests");
  redirect(`/requests/${request.id}`);
}
