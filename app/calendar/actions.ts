"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

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
