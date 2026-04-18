# Babysitter

Web app that texts your list of babysitters one-by-one for a specific night and
automatically moves to the next sitter based on their reply (YES / NO / MAYBE).

## Stack

- Next.js 14 (App Router) + TypeScript
- Prisma + SQLite
- Twilio for SMS (send + inbound webhook)

## Setup

### 1. Install deps and init the DB

```bash
npm install
cp .env.example .env
# edit .env — set SESSION_PASSWORD and SESSION_SECRET (see comments)
npx prisma db push
npm run db:seed   # optional: adds 5 fake sitters to try the UI
```

### 2. Get Twilio credentials

1. Create a Twilio account at <https://www.twilio.com>.
2. Buy an SMS-capable phone number (~$1.15/mo).
3. From the console, copy your Account SID and Auth Token.
4. For a US number sending to US recipients, register for
   [A2P 10DLC](https://www.twilio.com/docs/sms/a2p-10dlc) — otherwise your
   messages will be filtered.
5. Fill in `.env`:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+15551234567
```

### 3. Expose your local server for inbound webhooks

Twilio needs a public URL to POST inbound messages to. While developing:

```bash
npx ngrok http 3000
```

Then set `PUBLIC_BASE_URL=https://<subdomain>.ngrok.app` in `.env`.

### 4. Point Twilio at the inbound webhook

In the Twilio console, open your phone number's settings. Under **Messaging
Configuration → A MESSAGE COMES IN**, set the webhook to:

```
https://<your-public-url>/api/twilio/inbound
```

Method: `HTTP POST`.

### 5. Run the app

In one terminal:

```bash
npm run dev
```

In another (so timed-out sitters are skipped automatically):

```bash
npm run worker
```

Open <http://localhost:3000>.

## How it works

1. Add each sitter (name, phone, availability notes, priority).
2. Start a new request with a date, time window, and optional notes.
3. The app texts the first sitter in priority order.
4. When they reply:
   - **YES** → the request is marked filled; the remaining queue is skipped.
   - **NO / MAYBE / unclear** → the app immediately texts the next sitter.
5. If a sitter doesn't reply within `REPLY_TIMEOUT_MINUTES` (default 30), the
   worker times them out and texts the next sitter.

## Deployment

- Any Node host that supports long-running processes works (Fly.io, Railway,
  Render). On serverless platforms, skip the worker and schedule
  `POST /api/cron/sweep` on a 1-minute cron instead.
- Set all env vars from `.env.example`.
- Switch `DATABASE_URL` to Postgres for production and run `prisma migrate
  deploy`.

## Auth

The web UI is protected by a single password (`SESSION_PASSWORD`). Login sets
a signed, HTTP-only cookie valid for 30 days. Middleware redirects unauthed
traffic to `/login`, except for `/api/twilio/*` (Twilio needs to POST there)
and `/api/cron/*` (so an external scheduler can hit the sweep endpoint).

For multi-user auth, swap the middleware + login action for your preferred
provider (NextAuth, Clerk, etc).

## Security notes

- `SESSION_SECRET` must be a long random string. Leaking it lets someone mint
  valid session cookies.
- The `/api/twilio/inbound` route validates Twilio's signature using your auth
  token and `PUBLIC_BASE_URL`. Disable with `VALIDATE_TWILIO_SIGNATURE=false`
  only for local testing.
- Sitter phone numbers are stored unencrypted in SQLite. Put it behind HTTPS
  when deploying publicly.
