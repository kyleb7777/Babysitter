import { prisma } from "./db";

export const SETTING_KEYS = {
  calendarIcsUrl: "calendar.ics_url",
} as const;

export async function getSetting(key: string): Promise<string | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row?.value ?? null;
  } catch {
    // If the Setting table doesn't exist yet (migration hasn't run), treat
    // as not configured instead of crashing the page.
    return null;
  }
}

export async function saveSetting(key: string, value: string | null): Promise<void> {
  if (!value) {
    await prisma.setting.delete({ where: { key } }).catch(() => {});
    return;
  }
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
