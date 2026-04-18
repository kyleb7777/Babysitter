import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Babysitter",
  description: "Sequential SMS outreach for finding a babysitter",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container headerRow">
            <Link href="/" className="brand">Babysitter</Link>
            <nav className="nav">
              <Link href="/sitters">Sitters</Link>
              <Link href="/requests">Requests</Link>
              <Link href="/requests/new" className="btn btnPrimary">New request</Link>
            </nav>
          </div>
        </header>
        <main className="container main">{children}</main>
      </body>
    </html>
  );
}
