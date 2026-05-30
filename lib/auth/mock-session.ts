import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";

function getSecret(): Uint8Array {
  const s = process.env.GOVDOC_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("GOVDOC_SESSION_SECRET must be ≥32 chars");
  return new TextEncoder().encode(s);
}

export type Session = { user: string };

export async function signSession(payload: Session): Promise<string> {
  return await new SignJWT({ user: payload.user })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.user !== "string") return null;
    return { user: payload.user };
  } catch {
    return null;
  }
}
