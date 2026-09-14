import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getParentStats } from "@/lib/parent-stats";
import { subscriptionLabel } from "@/lib/subscription-label";
import { ScaleBar } from "@/components/ScaleBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ feedback?: string }>;
}) {
  const session = await auth();
  const parentId = session?.user?.parentId;
  if (!parentId) redirect("/parent");

  const stats = await getParentStats(parentId);
  if (!stats) redirect("/parent");

  const { feedback } = await searchParams;

  async function submitFeedback(formData: FormData) {
    "use server";
    const message = String(formData.get("message") ?? "").trim();
    if (!message || !parentId) return;
    await db.feedback.create({ data: { parentId, message } });
    redirect("/parent/dashboard?feedback=sent");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Успехи ребёнка</h1>

      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-6">
          <p className="text-sm text-muted-foreground">
            Передайте устройство ребёнку — он войдёт по своему PIN и начнёт упражнение.
          </p>
          <a href="/child" className={cn(buttonVariants({ variant: "default" }), "w-fit")}>
            Начать занятие
          </a>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Обратная связь</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {feedback === "sent" && <p className="text-sm text-muted-foreground">Спасибо, мы получили ваше сообщение!</p>}
          <form action={submitFeedback} className="flex flex-col gap-3">
            <Textarea name="message" placeholder="Что-то работает не так или есть идея? Напишите нам." required />
            <Button type="submit" variant="secondary" className="w-fit">
              Отправить
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
