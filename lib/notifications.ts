import { twilioClient, twilioFromNumber } from "./twilio";
import { googleCalendarUrl } from "./calendar";

export type BookingRequestSummary = {
  date: string;
  timeWindow: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
};

export async function notifyBookingConfirmed(params: {
  sitterName: string;
  sitterPhone: string;
  request: BookingRequestSummary;
}) {
  const to = process.env.NOTIFY_SMS_NUMBER;
  if (!to) return;
  const { sitterName, sitterPhone, request } = params;
  const tz = process.env.TIME_ZONE || "America/New_York";

  let link: string | null = null;
  if (request.startTime && request.endTime) {
    link = googleCalendarUrl({
      title: `Babysitter: ${sitterName}`,
      details: `${sitterName} (${sitterPhone}) confirmed for ${request.timeWindow}.${request.notes ? `\n\n${request.notes}` : ""}`,
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime,
      timeZone: tz,
    });
  }

  const body = link
    ? `Babysitter confirmed! ${sitterName} on ${request.date} (${request.timeWindow}). Add to calendar: ${link}`
    : `Babysitter confirmed! ${sitterName} on ${request.date} (${request.timeWindow}).`;

  try {
    const client = twilioClient();
    await client.messages.create({ to, from: twilioFromNumber(), body });
  } catch (err) {
    console.error("notifyBookingConfirmed failed:", err);
  }
}
