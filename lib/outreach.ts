import { prisma } from "./db";
import { twilioClient, twilioFromNumber } from "./twilio";

export function composeRequestMessage(params: {
  sitterName: string;
  date: string;
  timeWindow: string;
  notes?: string | null;
}) {
  const { sitterName, date, timeWindow, notes } = params;
  const friendly = formatDate(date);
  const lines = [
    `Hi ${sitterName.split(" ")[0]}, it's Kyle via my sitter-scheduling app.`,
    `Any chance you're free to babysit ${friendly} (${timeWindow})?`,
  ];
  if (notes) lines.push(notes);
  lines.push(`Reply YES, NO, or MAYBE.`);
  lines.push(`Reply STOP to opt out, HELP for help. Msg & data rates may apply.`);
  return lines.join(" ");
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Send a specific outreach (regardless of what else is in flight). Marks it
 * SENT on success or ERROR on failure. Used by both waterfall (one at a time)
 * and blast (multiple at once) flows.
 */
export async function sendOutreach(outreachId: string) {
  const outreach = await prisma.outreach.findUnique({
    where: { id: outreachId },
    include: { sitter: true, request: true },
  });
  if (!outreach) return { sent: false, reason: "not_found" as const };
  if (outreach.status !== "QUEUED") {
    return { sent: false, reason: "not_queued" as const };
  }

  const message = composeRequestMessage({
    sitterName: outreach.sitter.name,
    date: outreach.request.date,
    timeWindow: outreach.request.timeWindow,
    notes: outreach.request.notes,
  });

  try {
    const client = twilioClient();
    await client.messages.create({
      to: outreach.sitter.phone,
      from: twilioFromNumber(),
      body: message,
    });
    await prisma.outreach.update({
      where: { id: outreach.id },
      data: { status: "SENT", sentAt: new Date() },
    });
    return { sent: true as const, outreachId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.outreach.update({
      where: { id: outreach.id },
      data: { status: "ERROR", errorText: msg },
    });
    return { sent: false, reason: "error" as const, error: msg };
  }
}

/**
 * Start a blast: send every outreach in the given list at once (all QUEUED).
 * Errors on any single sitter don't stop the others.
 */
export async function blastOutreaches(outreachIds: string[]) {
  const results = await Promise.all(outreachIds.map((id) => sendOutreach(id)));
  // If all blasts fell through (errors), fall back to the regular waterfall
  // so the request can still progress.
  const allFailed = results.length > 0 && results.every((r) => !r.sent);
  return { results, allFailed };
}

/**
 * Send the next queued outreach for a request (waterfall). If another outreach
 * is already in flight (SENT), wait for it. If nothing queued, mark EXHAUSTED.
 * Called when a request is created, when a sitter replies NO/MAYBE, or when a
 * send times out.
 */
export async function advanceRequest(requestId: string) {
  const request = await prisma.sitterRequest.findUnique({
    where: { id: requestId },
    include: { outreaches: { orderBy: { order: "asc" } } },
  });
  if (!request) return { advanced: false, reason: "not_found" as const };
  if (request.status !== "PENDING") {
    return { advanced: false, reason: "not_pending" as const };
  }

  const inFlight = request.outreaches.find((o) => o.status === "SENT");
  if (inFlight) return { advanced: false, reason: "in_flight" as const };

  const next = request.outreaches.find((o) => o.status === "QUEUED");
  if (!next) {
    await prisma.sitterRequest.update({
      where: { id: requestId },
      data: { status: "EXHAUSTED" },
    });
    return { advanced: false, reason: "exhausted" as const };
  }

  const result = await sendOutreach(next.id);
  if (result.sent) {
    return { advanced: true, outreachId: next.id };
  }
  // Error sending: move on to the next sitter
  return advanceRequest(requestId);
}

/**
 * Mark any SENT outreach older than its request's timeoutMinutes as TIMEOUT
 * and advance the request. Returns the number of advances performed.
 */
export async function sweepTimeouts() {
  const stale = await prisma.outreach.findMany({
    where: { status: "SENT", sentAt: { not: null } },
    include: { request: true },
  });
  const now = Date.now();
  let advanced = 0;
  for (const o of stale) {
    if (!o.sentAt) continue;
    const cutoff = o.sentAt.getTime() + o.request.timeoutMinutes * 60 * 1000;
    if (cutoff > now) continue;
    await prisma.outreach.update({
      where: { id: o.id },
      data: { status: "TIMEOUT" },
    });
    await advanceRequest(o.requestId);
    advanced++;
  }
  return advanced;
}
