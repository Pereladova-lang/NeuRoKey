import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyResultSignature } from "@/lib/robokassa";
import { nextSubscriptionState } from "@/lib/billing";

/**
 * Robokassa ResultURL webhook. Posts `application/x-www-form-urlencoded`, not
 * JSON. Always responds 200 (per Global Constraints — idempotent, no retries
 * hammering us over a permanently invalid signature); the success/failure
 * signal for Robokassa is the response body: `OK<InvId>` on success, anything
 * else means "not accepted, please retry".
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const form = new URLSearchParams(raw);
  const outSum = form.get("OutSum");
  const invId = form.get("InvId");
  const signatureValue = form.get("SignatureValue");
  const parentId = form.get("Shp_parentId");

  if (!outSum || !invId || !signatureValue || !parentId) {
    return new NextResponse("FAIL: missing required fields", { status: 200 });
  }

  const password2 = process.env.ROBOKASSA_PASSWORD2 ?? "";
  if (!verifyResultSignature(outSum, invId, parentId, signatureValue, password2)) {
    return new NextResponse("FAIL: invalid signature", { status: 200 });
  }

  const subscription = await db.subscription.findUnique({ where: { parentId } });
  if (!subscription) {
    return new NextResponse("FAIL: unknown parent", { status: 200 });
  }

  const next = nextSubscriptionState({ type: "payment_succeeded", invoiceId: invId }, new Date());
  await db.subscription.update({ where: { parentId }, data: next });

  return new NextResponse(`OK${invId}`, { status: 200 });
}
