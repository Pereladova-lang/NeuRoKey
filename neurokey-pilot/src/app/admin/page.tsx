import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [errors, feedback] = await Promise.all([
    db.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { parent: { select: { email: true } } } }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Админ</h1>

      <Card>
        <CardHeader>
          <CardTitle>Обратная связь от родителей ({feedback.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {feedback.length === 0 && <p className="text-sm text-muted-foreground">Пока пусто.</p>}
          {feedback.map((f) => (
            <div key={f.id} className="border-b border-border pb-2 text-sm last:border-0">
              <p className="text-muted-foreground">
                {f.parent.email} · {f.createdAt.toLocaleString("ru-RU")}
              </p>
              <p>{f.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ошибки ({errors.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {errors.length === 0 && <p className="text-sm text-muted-foreground">Ошибок не зафиксировано.</p>}
          {errors.map((e) => (
            <div key={e.id} className="border-b border-border pb-2 text-sm last:border-0">
              <p className="text-muted-foreground">
                [{e.source}] {e.createdAt.toLocaleString("ru-RU")} {e.path ? `· ${e.path}` : ""}
              </p>
              <p>{e.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
