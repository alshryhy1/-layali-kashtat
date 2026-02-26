
import crypto from "crypto";

export function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyAdminSession(token: string | undefined | null): boolean {
  if (!token) return false;
  const SECRET = process.env.ADMIN_SESSION_SECRET || "";
  if (!SECRET) return false;

  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const i = raw.lastIndexOf(".");
    if (i <= 0) return false;
    const payload = raw.slice(0, i);
    const sig = raw.slice(i + 1);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload, SECRET))))
      return false;
    const obj = JSON.parse(payload);
    return Date.now() <= obj.exp;
  } catch {
    return false;
  }
}
