/**
 * Signed session cookies — prevents clients from forging session=<anyUserId>.
 * Set SESSION_SECRET in production (min 32 random bytes as hex/base64).
 */
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "session";
export const DEFAULT_SESSION_MAX_AGE_SEC = 7 * 24 * 3600;

export function getSessionSecret(): string {
  return String(process.env.SESSION_SECRET || process.env.COOKIE_SECRET || "").trim();
}

function hmacBase64Url(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Token format: v1.<userId>.<expUnix>.<hmac> */
export function signSessionToken(userId: number, maxAgeSec: number = DEFAULT_SESSION_MAX_AGE_SEC): string {
  const secret = getSessionSecret();
  if (!secret) {
    return String(Math.floor(userId));
  }
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const payload = `v1.${userId}.${exp}`;
  return `${payload}.${hmacBase64Url(payload, secret)}`;
}

export function verifySessionToken(raw: string): number | null {
  const secret = getSessionSecret();
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (!secret) {
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }

  const parts = trimmed.split(".");
  if (parts.length === 4 && parts[0] === "v1") {
    const [, uidStr, expStr, sig] = parts;
    const uid = Number(uidStr);
    const exp = Number(expStr);
    if (!Number.isFinite(uid) || uid < 0 || !Number.isFinite(exp)) return null;
    if (Math.floor(Date.now() / 1000) > exp) return null;
    const payload = `v1.${uidStr}.${expStr}`;
    const expected = hmacBase64Url(payload, secret);
    try {
      const a = Buffer.from(sig, "base64url");
      const b = Buffer.from(expected, "base64url");
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    } catch {
      return null;
    }
    return Math.floor(uid);
  }

  return null;
}

export function parseSessionUserIdFromCookieHeader(cookieHeader: string | undefined): number | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`\\b${SESSION_COOKIE_NAME}=([^;\\s]+)`));
  if (!m) return null;
  let val = m[1];
  try {
    val = decodeURIComponent(val);
  } catch {
    /* use raw */
  }
  return verifySessionToken(val);
}

export function buildSetSessionCookieHeader(userId: number, maxAgeSec: number, isSecure: boolean): string {
  const token = signSessionToken(userId, maxAgeSec);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${maxAgeSec}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isSecure) parts.push("Secure");
  return parts.join("; ");
}

export function buildClearSessionCookieHeader(isSecure: boolean): string {
  const parts = [`${SESSION_COOKIE_NAME}=`, "Path=/", "Max-Age=0", "HttpOnly", "SameSite=Lax"];
  if (isSecure) parts.push("Secure");
  return parts.join("; ");
}

export function assertProductionSessionSecret(): void {
  if (process.env.NODE_ENV !== "production") return;
  const s = getSessionSecret();
  if (s.length >= 32) return;
  console.error(
    "[security] Production requires SESSION_SECRET (at least 32 characters). Example:\n" +
      '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
  process.exit(1);
}
