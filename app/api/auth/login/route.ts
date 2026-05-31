import { NextResponse } from "next/server";
import { signSession } from "@/lib/auth/mock-session";
import { verifyFileCredential } from "@/lib/auth/file-credentials";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  const username = body?.username;
  const password = body?.password;
  const valid =
    !!username &&
    !!password &&
    (await verifyFileCredential(username, password).catch(() => false));

  if (!valid) {
    return new NextResponse("Invalid credentials", { status: 401 });
  }

  const token = await signSession({ user: username! });
  const res = NextResponse.json({ ok: true });

  res.cookies.set("govdoc_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return res;
}
