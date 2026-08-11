import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getChildIdServer } from "@/lib/child-session";
import { POST as startSession } from "@/app/api/session/start/route";
import { Mascot } from "@/components/Mascot";
import { getMascotLine } from "@/lib/mascot-lines";
import { db } from "@/lib/db";
import { SessionRunner } from "@/components/SessionRunner";

export default async function ChildSessionPage() {
  const childId = await getChildIdServer();
  if (!childId) redirect("/child");

  const cookie = (await headers()).get("cookie") ?? "";
  const req = new Request("http://internal/api/session/start", {
    method: "POST",
    headers: { cookie },
  });
  const res = await startSession(req);

  if (res.status === 403) {
    const child = await db.child.findUnique({ where: { id: childId } });
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <Mascot level={child?.mascotLevel ?? 1} line={getMascotLine("trialEnded")} />
      </div>
    );
  }

  const data = (await res.json()) as {
    sessionId: string;
    exercises: { id: string; type: "comic" | "data" | "robot"; level: number; content: unknown }[];
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <SessionRunner sessionId={data.sessionId} exercises={data.exercises} />
    </div>
  );
}
