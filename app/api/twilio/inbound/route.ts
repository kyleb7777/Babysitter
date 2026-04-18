import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/db";
import { classifyReply, normalizePhone } from "@/lib/twilio";
import { advanceRequest } from "@/lib/outreach";

export const dynamic = "force-dynamic";

function twiml(body = "") {
  const xml = body
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(body)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response/>`;
  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!)
  );
}

export async function POST(req: NextRequest) {
  const formText = await req.text();
  const params = Object.fromEntries(new URLSearchParams(formText));

  if (process.env.VALIDATE_TWILIO_SIGNATURE !== "false") {
    const signature = req.headers.get("x-twilio-signature") ?? "";
    const base = process.env.PUBLIC_BASE_URL ?? "";
    const url = `${base.replace(/\/$/, "")}/api/twilio/inbound`;
    const token = process.env.TWILIO_AUTH_TOKEN ?? "";
    const valid = twilio.validateRequest(token, signature, url, params);
    if (!valid) {
      return new NextResponse("Invalid signature", { status: 403 });
    }
  }

  const from = normalizePhone(String(params.From ?? ""));
  const body = String(params.Body ?? "").trim();
  if (!from || !body) return twiml();

  const sitter = await prisma.sitter.findUnique({ where: { phone: from } });
  if (!sitter) {
    return twiml("Sorry, we don't have your number on file.");
  }

  // Find the most recent in-flight outreach for this sitter.
  const outreach = await prisma.outreach.findFirst({
    where: { sitterId: sitter.id, status: "SENT" },
    orderBy: { sentAt: "desc" },
    include: { request: true },
  });
  if (!outreach) {
    return twiml("Thanks! We don't have an open request for you right now.");
  }

  const classification = classifyReply(body);

  await prisma.outreach.update({
    where: { id: outreach.id },
    data: {
      status: classification === "UNKNOWN" ? "MAYBE" : classification,
      repliedAt: new Date(),
      replyBody: body,
    },
  });

  let responseMessage = "";
  if (classification === "YES") {
    await prisma.sitterRequest.update({
      where: { id: outreach.requestId },
      data: { status: "FILLED", filledById: sitter.id },
    });
    // Mark any still-queued outreaches as skipped so they aren't sent later.
    await prisma.outreach.updateMany({
      where: { requestId: outreach.requestId, status: "QUEUED" },
      data: { status: "TIMEOUT" },
    });
    responseMessage = `Amazing — thank you! I'll confirm the details with you shortly.`;
  } else if (classification === "NO") {
    responseMessage = `No worries, thanks for letting me know!`;
    await advanceRequest(outreach.requestId);
  } else {
    // MAYBE / UNKNOWN: treat as not-yet-confirmed, move on so we don't block.
    responseMessage = `Thanks! I'll check with the next sitter in the meantime and circle back.`;
    await advanceRequest(outreach.requestId);
  }

  return twiml(responseMessage);
}
