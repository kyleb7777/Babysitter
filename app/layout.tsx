import "./globals.css";
import { cookies } from "next/headers";
import Link from "next/link";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { authCookieName, verifySessionToken } from "@/lib/auth";
import { logout } from "./login/actions";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Babysitter",
  description: "Sequential SMS outreach for finding a babysitter",
};

function BrandMark() {
  return (
    <svg
      className="brandIcon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M20.5 14.5A8 8 0 0 1 9.5 3.5a.5.5 0 0 0-.65-.6A9 9 0 1 0 21.1 15.15a.5.5 0 0 0-.6-.65Z"
        fill="currentColor"
      />
      <circle cx="17" cy="6" r="1" fill="currentColor" />
      <circle cx="20" cy="10" r="0.7" fill="currentColor" />
    </svg>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(authCookieName())?.value;
  const signedIn = process.env.SESSION_SECRET
    ? await verifySessionToken(token)
    : false;

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <header className="header">
          <div className="container headerRow">
            <Link href="/" className="brand">
              <BrandMark />
              <span>Babysitter</span>
            </Link>
            <nav className="nav">
              {signedIn ? (
                <>
                  <Link href="/calendar">Calendar</Link>
                  <Link href="/sitters">Sitters</Link>
                  <Link href="/requests">Requests</Link>
                  <Link href="/status">Status</Link>
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
