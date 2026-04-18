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
  lines.push(`Reply YES, NO, or MAYBE. Thanks!`);
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
 * Send the next queued outreach for a request. If nothing queued, mark the
 * request as EXHAUSTED. Called when a request is created, when a sitter
 * replies NO/MAYBE, or when a send times out.
 */
export async function advanceRequest(requestId: string) {
  const request = await prisma.sitterRequest.findUnique({
    where: { id: requestId },
    include: { outreaches: { include: { sitter: true }, orderBy: { order: "asc" } } },
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

  const message = composeRequestMessage({
    sitterName: next.sitter.name,
    date: request.date,
    timeWindow: request.timeWindow,
    notes: request.notes,
  });

  try {
    const client = twilioClient();
    await client.messages.create({
      to: next.sitter.phone,
      from: twilioFromNumber(),
      body: message,
    });
    await prisma.outreach.update({
      where: { id: next.id },
      data: { status: "SENT", sentAt: new Date() },
    });
    return { advanced: true, outreachId: next.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.outreach.update({
      where: { id: next.id },
      data: { status: "ERROR", errorText: msg },
    });
    // move on to next sitter
    return advanceRequest(requestId);
  }
}

/**
 * Mark any SENT outreach older than the timeout as TIMEOUT and advance.
 * Returns the number of requests advanced.
 */
export async function sweepTimeouts() {
  const minutes = Number(process.env.REPLY_TIMEOUT_MINUTES ?? 30);
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const stale = await prisma.outreach.findMany({
    where: { status: "SENT", sentAt: { lt: cutoff } },
  });
  let advanced = 0;
  for (const o of stale) {
    await prisma.outreach.update({
      where: { id: o.id },
      data: { status: "TIMEOUT" },
    });
    await advanceRequest(o.requestId);
    advanced++;
  }
  return advanced;
}
