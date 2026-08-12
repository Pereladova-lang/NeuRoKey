import { db } from "@/lib/db";
import { ChildLoginForm } from "@/components/ChildLoginForm";

// No cookies()/headers() call here to otherwise opt this page out of the
// default static render, so without this it gets prerendered once at build
// time and serves a stale, cached child list in production forever — newly
// registered children would never show up on the login screen.
export const dynamic = "force-dynamic";

export default async function ChildLoginPage() {
  const children = await db.child.findMany({ select: { id: true, name: true, age: true } });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-semibold">Кто занимается?</h1>
      <ChildLoginForm profiles={children} />
    </div>
  );
}
