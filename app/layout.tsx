import "./globals.css";
import { cookies } from "next/headers";
import Link from "next/link";
import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
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
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Babysitter", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf6f0",
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

type TabDef = { href: string; label: string; icon: React.ReactNode };

const tabs: TabDef[] = [
  {
    href: "/calendar",
    label: "Calendar",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
        <path d="M3 9h18" />
        <path d="M8 3v3M16 3v3" />
      </svg>
    ),
  },
  {
    href: "/requests",
    label: "Requests",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12a8 8 0 1 1-3.2-6.4" />
        <path d="M21 4v5h-5" />
      </svg>
    ),
  },
  {
    href: "/sitters",
    label: "Sitters",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
      </svg>
    ),
  },
  {
    href: "/status",
    label: "Status",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 12h3l2-6 4 12 2-6h5" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </svg>
    ),
  },
];

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
            {signedIn && (
              <form action={logout}>
                <button type="submit" className="btn btnGhost" title="Sign out">
                  Sign out
                </button>
              </form>
            )}
          </div>
        </header>

        <main className="container main">{children}</main>

        {signedIn && (
          <nav className="tabbar" aria-label="Primary">
            <div className="tabbarInner">
              {tabs.map((t) => (
                <Link key={t.href} href={t.href} className="tab">
                  <span className="tabIcon">{t.icon}</span>
                  <span className="tabLabel">{t.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </body>
    </html>
  );
}
