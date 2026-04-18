"use server";

import { revalidatePath } from "next/cache";
import { saveSetting, SETTING_KEYS } from "@/lib/settings";

export async function saveCalendarUrl(formData: FormData) {
  const raw = String(formData.get("calendarIcsUrl") ?? "").trim();
  await saveSetting(SETTING_KEYS.calendarIcsUrl, raw || null);
  revalidatePath("/settings");
  revalidatePath("/calendar");
}

export async function disconnectCalendar() {
  await saveSetting(SETTING_KEYS.calendarIcsUrl, null);
  revalidatePath("/settings");
  revalidatePath("/calendar");
}
