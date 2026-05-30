import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";

const PUBLIC = ["/", "/login", "/api/auth/login", "/api/auth/logout", "/api/health"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }
  const cookie = req.cookies.get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip middleware for Next internals and root-level static assets (anything
  // ending in a common image / font / manifest extension served from /public).
  // Without this, requests for /llm-at-scale-logo.png on the unauthenticated
  // login page get 307'd to /login and the image breaks.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|otf|eot|webmanifest)$).*)",
  ],
};
