"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authCookieName,
  authMaxAge,
  checkPassword,
  issueSessionToken,
} from "@/lib/auth";

function safeNext(next: string | undefined) {
  if (!next) return "/";
  // Only allow relative paths, no protocol-relative or external redirects.
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/"));

  if (!checkPassword(password)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await issueSessionToken();
  cookies().set(authCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: authMaxAge(),
  });
  redirect(next);
}

export async function logout() {
  cookies().delete(authCookieName());
  redirect("/login");
}
