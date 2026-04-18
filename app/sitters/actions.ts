"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/twilio";
import { parseWeeklyFromFormData } from "@/lib/availability";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  availability: z.string().trim().default(""),
  rate: z.string().trim().optional().nullable(),
  priority: z.coerce.number().int().min(1).max(10).default(5),
  active: z.coerce.boolean().default(true),
});

export async function createSitter(formData: FormData) {
  const parsed = schema.parse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    availability: formData.get("availability") ?? "",
    rate: formData.get("rate") || null,
    priority: formData.get("priority") ?? 5,
    active: formData.get("active") === "on",
  });
  const phone = normalizePhone(parsed.phone);
  const weeklyAvailability = parseWeeklyFromFormData(formData);
  await prisma.sitter.create({ data: { ...parsed, phone, weeklyAvailability } });
  revalidatePath("/sitters");
  redirect("/sitters");
}

export async function updateSitter(formData: FormData) {
  const id = String(formData.get("id"));
  const parsed = schema.parse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    availability: formData.get("availability") ?? "",
    rate: formData.get("rate") || null,
    priority: formData.get("priority") ?? 5,
    active: formData.get("active") === "on",
  });
  const phone = normalizePhone(parsed.phone);
  const weeklyAvailability = parseWeeklyFromFormData(formData);
  await prisma.sitter.update({ where: { id }, data: { ...parsed, phone, weeklyAvailability } });
  revalidatePath("/sitters");
  redirect("/sitters");
}

export async function deleteSitter(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.sitter.delete({ where: { id } });
  revalidatePath("/sitters");
}
