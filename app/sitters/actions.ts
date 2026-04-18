"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/twilio";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  availability: z.string().trim().default(""),
  priority: z.coerce.number().int().default(100),
  active: z.coerce.boolean().default(true),
});

export async function createSitter(formData: FormData) {
  const parsed = schema.parse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    availability: formData.get("availability") ?? "",
    priority: formData.get("priority") ?? 100,
    active: formData.get("active") === "on",
  });
  const phone = normalizePhone(parsed.phone);
  await prisma.sitter.create({ data: { ...parsed, phone } });
  revalidatePath("/sitters");
  redirect("/sitters");
}

export async function updateSitter(formData: FormData) {
  const id = String(formData.get("id"));
  const parsed = schema.parse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    availability: formData.get("availability") ?? "",
    priority: formData.get("priority") ?? 100,
    active: formData.get("active") === "on",
  });
  const phone = normalizePhone(parsed.phone);
  await prisma.sitter.update({ where: { id }, data: { ...parsed, phone } });
  revalidatePath("/sitters");
  redirect("/sitters");
}

export async function deleteSitter(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.sitter.delete({ where: { id } });
  revalidatePath("/sitters");
}
