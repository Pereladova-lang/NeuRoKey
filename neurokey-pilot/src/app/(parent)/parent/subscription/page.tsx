import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptionLabel } from "@/lib/subscription-label";
import { POST as checkoutHandler } from "@/app/api/billing/checkout/route";
import { CancelSubscriptionButton } from "@/components/CancelSubscriptionButton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SubscriptionPage() {
  const session = await auth();
  const parentId = session?.user?.parentId;
  if (!parentId) redirect("/parent");

  const subscription = await db.subscription.findUnique({ where: { parentId } });
  if (!subscription) redirect("/parent/dashboard");

  async function subscribe() {
    "use server";
    const res = await checkoutHandler();
    const data = await res.json();
    if (data.checkoutUrl) redirect(data.checkoutUrl);
  }

  const canSubscribe = ["trial", "expired", "past_due", "canceled"].includes(subscription.status);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Подписка</h1>
      <Card>
        <CardHeader>
          <CardTitle>Тариф</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{subscriptionLabel(subscription)}</p>
          <p className="text-lg font-medium">299 ₽ / месяц</p>
          {canSubscribe && (
            <form action={subscribe}>
              <Button type="submit">Оформить</Button>
            </form>
          )}
          {subscription.status === "active" && <CancelSubscriptionButton />}
        </CardContent>
      </Card>
    </div>
  );
}
