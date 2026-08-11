import { db } from "@/lib/db";
import { ChildLoginForm } from "@/components/ChildLoginForm";

export default async function ChildLoginPage() {
  const children = await db.child.findMany({ select: { id: true, name: true, age: true } });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-semibold">Кто занимается?</h1>
      <ChildLoginForm profiles={children} />
    </div>
  );
}
