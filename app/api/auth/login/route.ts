import { NextResponse } from "next/server";
import { signSession } from "@/lib/auth/mock-session";
import users from "@/data/users.json";

type UserRecord = {
  uid: string;
  password: string;
  name?: string;
  role?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;

  if (!body || !body.username || !body.password) {
    return new NextResponse("Invalid credentials", { status: 401 });
  }

  const matchedUser = (users as UserRecord[]).find(
    (user) => user.uid === body.username && user.password === body.password
  );

  if (!matchedUser) {
    return new NextResponse("Invalid credentials", { status: 401 });
  }

  const token = await signSession({
    user: matchedUser.uid,
  });

  const res = NextResponse.json({
    ok: true,
    user: {
      uid: matchedUser.uid,
      name: matchedUser.name,
      role: matchedUser.role,
    },
  });

  res.cookies.set("govdoc_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return res;
}
