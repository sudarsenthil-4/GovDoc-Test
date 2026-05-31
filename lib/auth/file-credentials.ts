import { readFile } from "node:fs/promises";
import path from "node:path";

type Credential = {
  uid?: string;
  username?: string;
  password?: string;
};

type CredentialFile =
  | Credential
  | {
      users?: Credential[];
    };

export function getCredentialFilePath(): string {
  return process.env.GOVDOC_AUTH_FILE ?? path.join(process.cwd(), "auth.local.json");
}

export async function verifyFileCredential(username: string, password: string): Promise<boolean> {
  const raw = await readFile(getCredentialFilePath(), "utf8");
  const parsed = JSON.parse(raw) as CredentialFile;
  const users = Array.isArray((parsed as { users?: Credential[] }).users)
    ? (parsed as { users: Credential[] }).users
    : [parsed as Credential];

  return users.some((user) => {
    const uid = user.uid ?? user.username;
    return uid === username && user.password === password;
  });
}
