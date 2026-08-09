import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  childName: z.string().min(1),
  childAge: z.number().int().min(11).max(14),
  childPin: z.string().regex(/^\d{4}$/),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { email, password, childName, childAge, childPin } = parsed.data;

  if (await db.parent.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const trialDaysConfig = await db.config.findUnique({ where: { key: "trialDays" } });
  const trialDays = Number(trialDaysConfig?.value ?? "3");

  await db.parent.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      subscription: { create: { trialEndsAt: new Date(Date.now() + trialDays * 864e5) } },
      children: { create: { name: childName, age: childAge, pin: childPin } },
    },
  });

  return NextResponse.json({ ok: true });
}
