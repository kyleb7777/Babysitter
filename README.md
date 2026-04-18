# Babysitter

Web app that texts your list of babysitters one-by-one for a specific night and
automatically moves to the next sitter based on their reply (YES / NO / MAYBE).

## Stack

- Next.js 14 (App Router) + TypeScript
- Prisma + PostgreSQL
- Twilio for SMS (send + inbound webhook)

## Deploy to Railway (recommended, ~$5/mo)

Fastest path to a live URL both you and your partner can bookmark.

1. **Push this repo to GitHub** (skip if it's already there).
2. **Create a new Railway project** → "Deploy from GitHub repo" → pick the repo.
3. **Add Postgres**: New → Database → PostgreSQL. Railway wires
   `DATABASE_URL` into the app automatically.
4. **Set environment variables** on the web service (see `.env.example`):
   - `SESSION_PASSWORD` — what you'll both type to sign in
   - `SESSION_SECRET` — a long random string:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
   - `PUBLIC_BASE_URL` — leave blank for now, you'll fill it after Railway gives
     you a public domain
   - `REPLY_TIMEOUT_MINUTES` — optional, defaults to 30
5. **Generate a public domain** on the Railway service (Settings → Networking →
   Generate Domain). Set `PUBLIC_BASE_URL=https://<your-domain>` and redeploy.
6. **Point Twilio at the webhook**: in the Twilio console, open your phone
   number → Messaging Configuration → "A message comes in" →
   `https://<your-domain>/api/twilio/inbound` (HTTP POST).
7. **Sign in** at `https://<your-domain>/login`, add your sitters, start a
   request.

The build runs `prisma migrate deploy` automatically, so the schema is created
on first boot. The `start` script runs both the web server and the timeout
worker via `concurrently`.

## Local development

Requires Docker (for Postgres) and Node 20+.

```bash
docker compose up -d            # starts Postgres on :5432
npm install
cp .env.example .env
# edit .env — set SESSION_PASSWORD, SESSION_SECRET, Twilio creds
npx prisma migrate deploy
npm run db:seed                  # optional: 5 fake sitters
npm run dev                      # web server
npm run worker                   # in another terminal, for timeout sweeping
```

Open <http://localhost:3000>.

### Local Twilio webhook

Twilio needs a public URL to POST replies to. Use ngrok:

```bash
npx ngrok http 3000
```

Set `PUBLIC_BASE_URL=https://<subdomain>.ngrok.app` in `.env` and point your
Twilio number's inbound webhook at `https://<subdomain>.ngrok.app/api/twilio/inbound`.

## Twilio setup

1. Create a Twilio account at <https://www.twilio.com>.
2. Buy an SMS-capable phone number (~$1.15/mo).
3. From the console, copy your Account SID and Auth Token.
4. For a US number sending to US recipients, register for
   [A2P 10DLC](https://www.twilio.com/docs/sms/a2p-10dlc) — otherwise carriers
   will filter your messages.

## How it works

1. Add each sitter (name, phone, availability notes, priority).
2. Start a new request with a date, time window, and optional notes.
3. The app texts the first sitter in priority order.
4. When they reply:
   - **YES** → the request is marked filled; the remaining queue is skipped.
   - **NO / MAYBE / unclear** → the app immediately texts the next sitter.
5. If a sitter doesn't reply within `REPLY_TIMEOUT_MINUTES` (default 30), the
   worker times them out and texts the next sitter.

## Auth

The web UI is protected by a single password (`SESSION_PASSWORD`) — you and
your partner share it. Login sets a signed, HTTP-only cookie valid for 30
days. Middleware redirects unauthed traffic to `/login`, except for
`/api/twilio/*` (Twilio needs to POST there) and `/api/cron/*` (for external
schedulers).

## Security notes

- `SESSION_SECRET` must be a long random string. Leaking it lets someone mint
  valid session cookies.
- The `/api/twilio/inbound` route validates Twilio's signature using your auth
  token and `PUBLIC_BASE_URL`. Disable with `VALIDATE_TWILIO_SIGNATURE=false`
  only for local testing.
- Sitter phone numbers are stored unencrypted in Postgres. Always deploy
  behind HTTPS (Railway provides this automatically).
