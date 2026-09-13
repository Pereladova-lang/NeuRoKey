import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return new NextResponse("ADMIN_PASSWORD is not set", { status: 503 });

  const auth = req.headers.get("authorization");
  if (auth === `Basic ${Buffer.from(`admin:${password}`).toString("base64")}`) {
    return NextResponse.next();
  }

  return new NextResponse("Auth required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin"' },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
