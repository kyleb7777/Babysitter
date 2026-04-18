import { NextRequest, NextResponse } from "next/server";
import { authCookieName, verifySessionToken } from "./lib/auth";

// Public paths — reachable without auth.
const PUBLIC_PREFIXES = ["/login", "/api/twilio", "/api/cron"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(authCookieName())?.value;
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Fail closed: if the app is misconfigured, don't silently serve pages.
    return new NextResponse("SESSION_SECRET not set on the server.", {
      status: 500,
    });
  }
  const ok = await verifySessionToken(token, secret);
  if (ok) return NextResponse.next();

  const login = req.nextUrl.clone();
  login.pathname = "/login";
  login.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static files.
    "/((?!_next/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml|woff2?)).*)",
  ],
};
