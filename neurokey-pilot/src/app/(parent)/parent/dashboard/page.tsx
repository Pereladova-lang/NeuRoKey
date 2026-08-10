import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getParentStats } from "@/lib/parent-stats";
import { ScaleBar } from "@/components/ScaleBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(d));
}

function subscriptionLabel(sub: { status: string; trialEndsAt: Date | string; nextBillingAt: Date | string | null }) {
  switch (sub.status) {
    case "trial":
      return `Пробный период до ${formatDate(sub.trialEndsAt)}`;
    case "active":
      return sub.nextBillingAt ? `Активна, следующее списание ${formatDate(sub.nextBillingAt)}` : "Активна";
    case "past_due":
      return "Проблема с оплатой — доступ сохранён ещё на несколько дней";
    case "expired":
      return "Пробный период закончился";
    case "canceled":
      return "Подписка отменена";
    default:
      return sub.status;
  }
}

export default async function ParentDashboardPage() {
  const session = await auth();
  const parentId = session?.user?.parentId;
  if (!parentId) redirect("/parent");

  const stats = await getParentStats(parentId);
  if (!stats) redirect("/parent");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Успехи ребёнка</h1>

      {stats.children.map((child) => (
        <Card key={child.id}>
          <CardHeader>
            <CardTitle>{child.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>🔥 Стрик: {child.streak}</span>
              <span>Сессий за неделю: {child.sessionsThisWeek}</span>
            </div>
            <div className="flex flex-col gap-3">
              <ScaleBar scale="attention" value={child.scales.current.attention} delta={child.scales.delta.attention} />
              <ScaleBar scale="memory" value={child.scales.current.memory} delta={child.scales.delta.memory} />
              <ScaleBar scale="logic" value={child.scales.current.logic} delta={child.scales.delta.logic} />
              <ScaleBar scale="control" value={child.scales.current.control} delta={child.scales.delta.control} />
            </div>
          </CardContent>
        </Card>
      ))}

      {stats.subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Подписка</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{subscriptionLabel(stats.subscription)}</p>
            <a href="/parent/subscription" className={cn(buttonVariants({ variant: "secondary" }), "w-fit")}>
              Управление подпиской
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
