import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCheckoutUrl } from "@/lib/robokassa";

const PRICE_RUB = 299;

export async function POST() {
  const session = await auth();
  const parentId = session?.user?.parentId;
  if (!parentId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (process.env.BILLING_MOCK === "1") {
    return NextResponse.json({ checkoutUrl: "/parent/subscription?mock=success" });
  }

  const merchantLogin = process.env.ROBOKASSA_MERCHANT_LOGIN;
  const password1 = process.env.ROBOKASSA_PASSWORD1;
  if (!merchantLogin || !password1) {
    return NextResponse.json({ error: "billing_not_configured" }, { status: 503 });
  }

  const invId = Math.floor(Date.now() / 1000) % 2147483647;
  const checkoutUrl = createCheckoutUrl(PRICE_RUB, "Подписка NeuRoKey", invId, parentId, {
    merchantLogin,
    password1,
    isTest: process.env.ROBOKASSA_IS_TEST === "true",
  });

  return NextResponse.json({ checkoutUrl });
}
