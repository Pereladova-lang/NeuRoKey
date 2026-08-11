import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getChildIdServer } from "@/lib/child-session";
import { getMascotLine } from "@/lib/mascot-lines";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";

function daysSince(date: Date, now: Date): number {
  return Math.floor((now.getTime() - date.getTime()) / 864e5);
}

export default async function ChildHomePage() {
  const childId = await getChildIdServer();
  if (!childId) redirect("/child");

  const child = await db.child.findUnique({ where: { id: childId } });
  if (!child) redirect("/child");

  const context = child.lastSessionAt && daysSince(child.lastSessionAt, new Date()) >= 2 ? "comeback" : "greeting";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <Mascot level={child.mascotLevel} line={getMascotLine(context)} />
      <p className="text-lg">🔥 Стрик: {child.streak}</p>
      <Link href="/child/session">
        <Button className="h-14 px-10 text-xl">Начать сессию</Button>
      </Link>
      <Link href="/child/progress" className="text-base text-primary underline underline-offset-4">
        Мои успехи
      </Link>
    </div>
  );
}
