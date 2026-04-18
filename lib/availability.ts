import { z } from "zod";

export const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

export type DayKey = (typeof DAYS)[number]["key"];

export const daySchema = z.object({
  enabled: z.boolean(),
  start: z.string(),
  end: z.string(),
  flexible: z.boolean(),
});

export const weeklyAvailabilitySchema = z.record(
  z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  daySchema,
);

export type DayAvailability = z.infer<typeof daySchema>;
export type WeeklyAvailability = Partial<Record<DayKey, DayAvailability>>;

export function emptyDay(): DayAvailability {
  return { enabled: false, start: "17:00", end: "22:00", flexible: false };
}

export function parseWeeklyFromFormData(formData: FormData): WeeklyAvailability {
  const result: WeeklyAvailability = {};
  for (const { key } of DAYS) {
    const enabled = formData.get(`avail_${key}_enabled`) === "on";
    const start = String(formData.get(`avail_${key}_start`) ?? "");
    const end = String(formData.get(`avail_${key}_end`) ?? "");
    const flexible = formData.get(`avail_${key}_flexible`) === "on";
    result[key] = { enabled, start, end, flexible };
  }
  return result;
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? "p" : "a";
  const hour12 = ((h + 11) % 12) + 1;
  return m ? `${hour12}:${String(m).padStart(2, "0")}${period}` : `${hour12}${period}`;
}

export function formatWeekly(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const weekly = raw as WeeklyAvailability;
  const parts: string[] = [];
  for (const { key, label } of DAYS) {
    const day = weekly[key];
    if (!day?.enabled) continue;
    const flex = day.flexible ? " flex" : "";
    parts.push(`${label} ${formatTime(day.start)}–${formatTime(day.end)}${flex}`);
  }
  return parts.join(" · ");
}

export function coerceWeekly(raw: unknown): WeeklyAvailability {
  const out: WeeklyAvailability = {};
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  for (const { key } of DAYS) {
    const d = src[key];
    if (d && typeof d === "object") {
      const dd = d as Record<string, unknown>;
      out[key] = {
        enabled: Boolean(dd.enabled),
        start: typeof dd.start === "string" ? dd.start : "17:00",
        end: typeof dd.end === "string" ? dd.end : "22:00",
        flexible: Boolean(dd.flexible),
      };
    } else {
      out[key] = emptyDay();
    }
  }
  return out;
}
