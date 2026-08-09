import crypto from "crypto";

const COOKIE_NAME = "nk_child";

function sign(childId: string): string {
  return crypto.createHmac("sha256", process.env.AUTH_SECRET!).update(childId).digest("hex");
}

export function childCookie(childId: string): string {
  const sig = sign(childId);
  return `${COOKIE_NAME}=${childId}.${sig}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax`;
}

export function getChildId(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const value = match.slice(COOKIE_NAME.length + 1);
  const dot = value.lastIndexOf(".");
  if (dot === -1) return null;
  const childId = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(childId);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  return childId;
}
