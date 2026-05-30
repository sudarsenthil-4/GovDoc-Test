import { NextResponse } from "next/server";

export async function POST() {
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: "/login" },
  });
  res.cookies.set("govdoc_session", "", { maxAge: 0, path: "/" });
  return res;
}
