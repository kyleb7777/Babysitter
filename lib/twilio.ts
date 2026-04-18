import twilio from "twilio";

export function twilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error("Twilio credentials are not set. See .env.example.");
  }
  return twilio(sid, token);
}

export function twilioFromNumber() {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error("TWILIO_FROM_NUMBER not set");
  return from;
}

export function normalizePhone(input: string) {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits;
}

export type ReplyClassification = "YES" | "NO" | "MAYBE" | "UNKNOWN";

export function classifyReply(body: string): ReplyClassification {
  const normalized = body.trim().toLowerCase();
  if (!normalized) return "UNKNOWN";
  const yes = /\b(yes|yep|yeah|sure|y|ok|okay|k|sounds good|i can|i'?m in|absolutely|of course|yup)\b/;
  const no = /\b(no|nope|n|can'?t|cannot|busy|unavailable|sorry)\b/;
  const maybe = /\b(maybe|might|not sure|unsure|possibly|tentative|let me check|check|get back)\b/;
  if (maybe.test(normalized)) return "MAYBE";
  if (yes.test(normalized)) return "YES";
  if (no.test(normalized)) return "NO";
  return "UNKNOWN";
}
