import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAuthenticationEntry } from "./lib/auth-routing";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (isAuthenticationEntry(path) || path === "/api/cron/check-disruptions" || path === "/icon.svg" || path === "/favicon.ico") return NextResponse.next();
  const secret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  let token = null;
  try { if (secret) token = await getToken({ req: request, secret }); } catch { /* Fail closed. */ }
  if (!token?.sub) {
    if (path.startsWith("/api/")) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", path + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  const headers = new Headers(request.headers);
  headers.set("x-workspace-path", path + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
