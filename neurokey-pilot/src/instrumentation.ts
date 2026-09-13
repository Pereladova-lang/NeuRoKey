import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (err, request) => {
  // Prisma doesn't run on the edge runtime; server errors there go unlogged.
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { db } = await import("@/lib/db");
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const digest = typeof err === "object" && err !== null && "digest" in err ? String((err as { digest: unknown }).digest) : undefined;

  await db.errorLog
    .create({ data: { source: "server", message, stack, digest, path: request.path } })
    .catch(() => {});
};
