import "./globals.css";
import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { authCookieName, verifySessionToken } from "@/lib/auth";
import { logout } from "./login/actions";

export const metadata: Metadata = {
  title: "Babysitter",
  description: "Sequential SMS outreach for finding a babysitter",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(authCookieName())?.value;
  const signedIn = process.env.SESSION_SECRET
    ? await verifySessionToken(token)
    : false;

  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container headerRow">
            <Link href="/" className="brand">Babysitter</Link>
            <nav className="nav">
              {signedIn ? (
                <>
                  <Link href="/sitters">Sitters</Link>
                  <Link href="/requests">Requests</Link>
                  <Link href="/requests/new" className="btn btnPrimary">New request</Link>
                  <form action={logout} style={{ display: "inline" }}>
                    <button type="submit" className="btn" title="Sign out">Sign out</button>
                  </form>
                </>
              ) : null}
            </nav>
          </div>
        </header>
        <main className="container main">{children}</main>
      </body>
    </html>
  );
}
