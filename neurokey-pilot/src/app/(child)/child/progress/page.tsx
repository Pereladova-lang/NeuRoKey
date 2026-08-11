import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getChildIdServer } from "@/lib/child-session";
import { Mascot } from "@/components/Mascot";
import { cn } from "@/lib/utils";

const ALL_BADGES: { key: string; emoji: string; label: string }[] = [
  { key: "firstSession", emoji: "🌟", label: "Первая тренировка" },
  { key: "sessions10", emoji: "🏆", label: "10 тренировок" },
  { key: "streak3", emoji: "🔥", label: "Стрик 3 дня" },
  { key: "streak7", emoji: "🔥🔥", label: "Стрик 7 дней" },
  { key: "level2", emoji: "⭐", label: "Уровень 2" },
  { key: "level3", emoji: "🌠", label: "Уровень 3" },
];

export default async function ChildProgressPage() {
  const childId = await getChildIdServer();
  if (!childId) redirect("/child");

  const child = await db.child.findUnique({ where: { id: childId }, include: { achievements: true } });
  if (!child) redirect("/child");

  const earned = new Set(child.achievements.map((a) => a.badgeKey));

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-8 p-6">
      <Mascot level={child.mascotLevel} />
      <div className="grid w-full grid-cols-3 gap-4">
        {ALL_BADGES.map((badge) => (
          <div
            key={badge.key}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl p-3 text-center",
              earned.has(badge.key) ? "bg-primary/10" : "bg-muted grayscale opacity-50",
            )}
          >
            <span className="text-3xl">{badge.emoji}</span>
            <span className="text-sm">{badge.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
