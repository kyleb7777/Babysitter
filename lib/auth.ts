const COOKIE_NAME = "bs_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function authCookieName() {
  return COOKIE_NAME;
}

export function authMaxAge() {
  return MAX_AGE_SECONDS;
}

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "SESSION_SECRET must be set to a random string of 16+ chars."
    );
  }
  return s;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

async function sign(value: string, secret: string) {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return toHex(sig);
}

/** Returns "<issuedAt>.<signature>". */
export async function issueSessionToken() {
  const issuedAt = Date.now().toString();
  const sig = await sign(issuedAt, getSecret());
  return `${issuedAt}.${sig}`;
}

/** Edge-safe: works in middleware and node runtimes. */
export async function verifySessionToken(token: string | undefined, secret?: string) {
  if (!token) return false;
  const [issuedAt, sig] = token.split(".");
  if (!issuedAt || !sig) return false;

  const s = secret ?? getSecret();
  let expected: string;
  try {
    expected = await sign(issuedAt, s);
  } catch {
    return false;
  }
  if (expected.length !== sig.length) return false;

  // Constant-time compare
  const a = fromHex(sig);
  const b = fromHex(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return false;

  const ageMs = Date.now() - Number(issuedAt);
  if (!Number.isFinite(ageMs) || ageMs < 0) return false;
  return ageMs < MAX_AGE_SECONDS * 1000;
}

export function checkPassword(input: string) {
  const expected = process.env.SESSION_PASSWORD;
  if (!expected) {
    throw new Error("SESSION_PASSWORD must be set.");
  }
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < input.length; i++) {
    diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
