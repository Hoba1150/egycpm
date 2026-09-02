import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ORDER_MANAGER"];

function parseSessionToken(token: string) {
  try {
    const json = Buffer.from(token, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect all Admin UI Routes: /admin, /admin/products, /admin/orders, etc. (except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken = request.cookies.get("cpm_admin_session_token")?.value;

    if (!adminToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = parseSessionToken(adminToken);
    if (!session || !ADMIN_ROLES.includes(session.role) || session.status === "BANNED") {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Admin APIs: /api/backup, /api/settings (PUT/POST), etc.
  if (pathname.startsWith("/api/backup")) {
    const adminToken = request.cookies.get("cpm_admin_session_token")?.value;
    const session = adminToken ? parseSessionToken(adminToken) : null;

    if (!session || !ADMIN_ROLES.includes(session.role) || session.status === "BANNED") {
      return NextResponse.json(
        { error: "غير مصرح لك بالوصول إلى هذه الواجهة البرمجية." },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/backup/:path*",
  ],
};
