/**
 * Background worker. Runs sweepTimeouts on an interval so that if a sitter
 * doesn't reply within REPLY_TIMEOUT_MINUTES, we automatically text the next
 * one. Run with `npm run worker` alongside `npm run dev`.
 */
import { sweepTimeouts } from "../lib/outreach";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);

async function tick() {
  try {
    const n = await sweepTimeouts();
    if (n > 0) console.log(`[worker] advanced ${n} request(s)`);
  } catch (err) {
    console.error("[worker] error", err);
  }
}

console.log(`[worker] started, interval ${INTERVAL_MS}ms`);
void tick();
setInterval(tick, INTERVAL_MS);
