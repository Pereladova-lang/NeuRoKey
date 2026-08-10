import { db } from "@/lib/db";
import { aggregateWeek } from "@/lib/engine";

const WEEK_MS = 7 * 864e5;

export async function getParentStats(parentId: string) {
  const parent = await db.parent.findUnique({
    where: { id: parentId },
    include: {
      subscription: true,
      children: {
        include: { sessions: { include: { results: true } } },
      },
    },
  });
  if (!parent) return null;

  const now = new Date();
  const children = parent.children.map((child) => {
    const results = child.sessions.flatMap((s) => s.results);
    const { current, delta } = aggregateWeek(results, now);
    const sessionsThisWeek = child.sessions.filter(
      (s) => s.finishedAt && now.getTime() - s.finishedAt.getTime() < WEEK_MS,
    ).length;

    return {
      id: child.id,
      name: child.name,
      streak: child.streak,
      sessionsThisWeek,
      scales: { current, delta },
    };
  });

  return {
    children,
    subscription: parent.subscription
      ? {
          status: parent.subscription.status,
          trialEndsAt: parent.subscription.trialEndsAt,
          nextBillingAt: parent.subscription.nextBillingAt,
        }
      : null,
  };
}
